"""Stripe plumbing for project invoices.

Money state changes only here, and only from a verified webhook. The client
never writes to an invoice.
"""

import logging

from django.conf import settings
from django.utils import timezone

from .models import ProjectInvoice


logger = logging.getLogger(__name__)


def stripe_configured():
    return bool(getattr(settings, "STRIPE_SECRET_KEY", ""))


def _stripe():
    import stripe

    stripe.api_key = settings.STRIPE_SECRET_KEY
    return stripe


def app_base_url(request=None):
    configured = getattr(settings, "PUBLIC_APP_URL", "").rstrip("/")
    if configured:
        return configured
    if request is not None:
        return request.build_absolute_uri("/").rstrip("/")
    return ""


def create_checkout_session(invoice, request=None):
    """Create (or reuse) a Stripe Checkout Session for one invoice.

    Returns (session_url, session_id). Raises RuntimeError when Stripe is not
    configured, and stripe.error.StripeError on API failure.
    """
    if not stripe_configured():
        raise RuntimeError("Stripe not configured")

    if invoice.stripe_checkout_session_id:
        existing = _stripe().checkout.Session.retrieve(invoice.stripe_checkout_session_id)
        if existing.status == "open" and existing.url:
            return existing.url, existing.id

    stripe = _stripe()
    invoice_number = f"INV-{invoice.pk:04d}"
    base = app_base_url(request)
    milestone = invoice.milestone

    session = stripe.checkout.Session.create(
        mode="payment",
        client_reference_id=str(invoice.pk),
        customer_email=invoice.client_email or None,
        line_items=[
            {
                "quantity": 1,
                "price_data": {
                    "currency": invoice.currency.lower(),
                    "unit_amount": int(invoice.amount * 100),
                    "product_data": {
                        "name": invoice.label or invoice_number,
                        "description": (invoice.description or "")[:500],
                    },
                },
            }
        ],
        metadata={
            "kind": "project_invoice",
            "invoice_id": str(invoice.pk),
            "invoice_number": invoice_number,
            "project_id": str(invoice.project_id),
            "milestone_id": str(milestone.pk) if milestone else "",
        },
        payment_intent_data={
            "metadata": {
                "kind": "project_invoice",
                "invoice_id": str(invoice.pk),
            }
        },
        success_url=f"{base}/app/invoices/{invoice.pk}/?paid=1" if base else "",
        cancel_url=f"{base}/app/invoices/{invoice.pk}/?canceled=1" if base else "",
    )

    invoice.stripe_checkout_session_id = session.id
    invoice.status = "sent"
    invoice.save(update_fields=["stripe_checkout_session_id", "status", "updated_at"])
    return session.url, session.id


def _resolve_invoice(session):
    """Returns (invoice, trusted). An invoice found by its stored checkout
    session id is trusted even without metadata, since that id was written by
    us when the session was created."""
    invoice_id = (session.get("metadata") or {}).get("invoice_id")
    if invoice_id:
        invoice = ProjectInvoice.objects.filter(pk=invoice_id).first()
        if invoice is not None:
            return invoice, True
    checkout_session_id = session.get("id")
    if checkout_session_id:
        invoice = ProjectInvoice.objects.filter(
            stripe_checkout_session_id=checkout_session_id
        ).first()
        if invoice is not None:
            return invoice, True
    return None, False


def mark_paid(invoice, payment_intent_id="", event_id=""):
    """Flip an invoice to paid. Idempotent: Stripe retries webhooks."""
    if invoice is None or invoice.status == "paid":
        return invoice
    invoice.status = "paid"
    if payment_intent_id:
        invoice.stripe_payment_intent_id = payment_intent_id
    invoice.paid_at = timezone.now()
    invoice.save(update_fields=["status", "stripe_payment_intent_id", "paid_at", "updated_at"])
    logger.info(
        "Invoice %s marked paid (intent=%s event=%s)", invoice.pk, payment_intent_id, event_id,
    )
    return invoice


def mark_void_or_overdue(invoice):
    """A failed or expired payment moves a sent invoice to overdue, never paid."""
    if invoice is None or invoice.status in ("paid", "void", "draft"):
        return invoice
    invoice.status = "overdue"
    invoice.save(update_fields=["status", "updated_at"])
    return invoice


def handle_invoice_event(event):
    """Handle the invoice-relevant Stripe events. Returns the invoice touched."""
    event_type = event.get("type")
    obj = (event.get("data") or {}).get("object") or {}

    if event_type == "checkout.session.completed":
        invoice, trusted = _resolve_invoice(obj)
        if not trusted:
            return None
        intent = obj.get("payment_intent")
        if isinstance(intent, dict):
            intent = intent.get("id", "")
        return mark_paid(invoice, payment_intent_id=intent or "", event_id=event.get("id", ""))

    if event_type == "checkout.session.expired":
        invoice, trusted = _resolve_invoice(obj)
        if not trusted:
            return None
        return mark_void_or_overdue(invoice)

    if event_type == "payment_intent.succeeded":
        metadata = obj.get("metadata") or {}
        if metadata.get("kind") != "project_invoice":
            return None
        invoice = ProjectInvoice.objects.filter(pk=metadata.get("invoice_id")).first()
        return mark_paid(invoice, payment_intent_id=obj.get("id", ""), event_id=event.get("id", ""))

    if event_type == "payment_intent.payment_failed":
        metadata = obj.get("metadata") or {}
        if metadata.get("kind") != "project_invoice":
            return None
        invoice = ProjectInvoice.objects.filter(pk=metadata.get("invoice_id")).first()
        return mark_void_or_overdue(invoice)

    return None