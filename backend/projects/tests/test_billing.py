from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from projects.models import Project, ProjectInvoice
from projects.stripe_billing import handle_invoice_event
from workstreams.models import Milestone


User = get_user_model()


def invoice_list_url(project):
    return reverse("invoice-list", kwargs={"project_pk": project.pk})


def invoice_detail_url(project, invoice):
    return reverse("invoice-detail", kwargs={"project_pk": project.pk, "pk": invoice.pk})


class InvoiceTestBase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Acme", project_name="Storefront", slug="billing-project",
            budget=Decimal("10000.00"), currency="USD",
        )
        self.milestone = Milestone.objects.create(
            project=self.project, name="Discovery complete", phase="discovery",
        )
        self.staff = User.objects.create_user(
            username="billing-staff", password="correct-horse-9", is_staff=True,
        )
        self.client_user = User.objects.create_user(
            username="billing-client", password="correct-horse-9",
        )
        self.outsider = User.objects.create_user(
            username="billing-outsider", password="correct-horse-9",
        )
        self.project.members.add(self.staff, self.client_user)

        self.invoice = ProjectInvoice.objects.create(
            project=self.project, milestone=self.milestone,
            label="Deposit — unlocks discovery",
            description="40% deposit before discovery starts.",
            amount=Decimal("4000.00"), currency="USD", client_email="ap@acme.test",
        )


class InvoiceCreationTests(InvoiceTestBase):
    def test_staff_can_issue_invoice(self):
        self.client.force_login(self.staff)
        resp = self.client.post(invoice_list_url(self.project), {
            "label": "Build phase",
            "amount": "3500.00",
            "milestone": self.milestone.pk,
        }, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["status"], "draft")
        self.assertEqual(resp.data["milestone_name"], "Discovery complete")
        self.assertEqual(resp.data["invoice_number"], f"INV-{resp.data['id']:04d}")

    def test_new_invoice_inherits_project_currency(self):
        self.client.force_login(self.staff)
        resp = self.client.post(invoice_list_url(self.project), {
            "label": "No currency given", "amount": "100.00",
        }, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(ProjectInvoice.objects.get(pk=resp.data["id"]).currency, "USD")

    def test_client_member_cannot_issue_invoice(self):
        self.client.force_login(self.client_user)
        resp = self.client.post(invoice_list_url(self.project), {
            "label": "Client issued", "amount": "100.00",
        }, format="json")
        self.assertEqual(resp.status_code, 403)
        self.assertEqual(ProjectInvoice.objects.count(), 1)

    def test_anonymous_cannot_issue_invoice(self):
        resp = self.client.post(invoice_list_url(self.project), {
            "label": "Anon", "amount": "100.00",
        }, format="json")
        self.assertIn(resp.status_code, (401, 403))

    def test_zero_amount_rejected(self):
        self.client.force_login(self.staff)
        for amount in ("0", "-10.00"):
            resp = self.client.post(invoice_list_url(self.project), {
                "label": "Bad", "amount": amount,
            }, format="json")
            self.assertEqual(resp.status_code, 400, resp.data)

    def test_milestone_from_another_project_rejected(self):
        other = Project.objects.create(
            client_name="Other", project_name="Other", slug="other-billing",
        )
        foreign_milestone = Milestone.objects.create(
            project=other, name="Foreign", phase="build",
        )
        self.client.force_login(self.staff)
        resp = self.client.post(invoice_list_url(self.project), {
            "label": "Cross project", "amount": "100.00", "milestone": foreign_milestone.pk,
        }, format="json")
        self.assertEqual(resp.status_code, 400, resp.data)
        self.assertIn("milestone", resp.data["error"])

    def test_invoice_cannot_be_created_on_unknown_project(self):
        self.client.force_login(self.staff)
        resp = self.client.post("/api/projects/999999/invoices/", {
            "label": "Ghost", "amount": "100.00",
        }, format="json")
        self.assertEqual(resp.status_code, 404)


class InvoiceReadPermissionTests(InvoiceTestBase):
    def test_client_sees_sent_invoice_but_not_draft(self):
        draft = ProjectInvoice.objects.create(
            project=self.project, label="Internal draft", amount=Decimal("10.00"),
        )
        self.invoice.status = "sent"
        self.invoice.save(update_fields=["status"])
        self.client.force_login(self.client_user)
        rows = self.client.get(invoice_list_url(self.project)).data["results"]
        ids = [row["id"] for row in rows]
        self.assertIn(self.invoice.pk, ids)
        self.assertNotIn(draft.pk, ids)

    def test_client_sees_paid_invoice(self):
        self.invoice.status = "paid"
        self.invoice.save(update_fields=["status"])
        self.client.force_login(self.client_user)
        rows = self.client.get(invoice_list_url(self.project)).data["results"]
        self.assertEqual([row["id"] for row in rows], [self.invoice.pk])

    def test_client_cannot_read_foreign_project_invoice(self):
        self.client.force_login(self.outsider)
        self.assertEqual(
            self.client.get(invoice_list_url(self.project)).data["results"], []
        )
        resp = self.client.get(invoice_detail_url(self.project, self.invoice))
        self.assertEqual(resp.status_code, 404)
        # A 404 must not leak the amount either.
        self.assertNotIn("4000.00", str(resp.data))

    def test_client_cannot_edit_or_delete_invoice(self):
        self.client.force_login(self.client_user)
        url = invoice_detail_url(self.project, self.invoice)
        self.assertEqual(
            self.client.patch(url, {"label": "Hijacked"}, format="json").status_code, 403
        )
        self.assertEqual(self.client.delete(url).status_code, 403)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.label, "Deposit — unlocks discovery")

    def test_anonymous_cannot_list_invoices(self):
        self.assertIn(
            self.client.get(invoice_list_url(self.project)).status_code, (401, 403)
        )


class InvoiceStatusTests(InvoiceTestBase):
    def test_staff_cannot_mark_invoice_paid(self):
        self.client.force_login(self.staff)
        resp = self.client.patch(
            invoice_detail_url(self.project, self.invoice),
            {"status": "paid"}, format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "draft")

    def test_staff_can_edit_draft_amount(self):
        self.client.force_login(self.staff)
        resp = self.client.patch(
            invoice_detail_url(self.project, self.invoice),
            {"amount": "4500.00", "due_date": (timezone.now() + timedelta(days=14)).date().isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.amount, Decimal("4500.00"))

    def test_client_cannot_write_stripe_fields(self):
        self.client.force_login(self.staff)
        resp = self.client.patch(
            invoice_detail_url(self.project, self.invoice),
            {"stripe_payment_intent_id": "pi_forged", "paid_at": timezone.now().isoformat()},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.stripe_payment_intent_id, "")
        self.assertIsNone(self.invoice.paid_at)

    def test_staff_can_void_invoice(self):
        self.client.force_login(self.staff)
        resp = self.client.post(
            reverse("invoice-void", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "void")

    def test_paid_invoice_cannot_be_voided(self):
        self.invoice.status = "paid"
        self.invoice.save(update_fields=["status"])
        self.client.force_login(self.staff)
        resp = self.client.post(
            reverse("invoice-void", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")

    def test_client_cannot_void_invoice(self):
        self.client.force_login(self.client_user)
        resp = self.client.post(
            reverse("invoice-void", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 403)


class InvoiceSendTests(InvoiceTestBase):
    @override_settings(STRIPE_SECRET_KEY="")
    def test_send_without_stripe_configured_is_503(self):
        self.client.force_login(self.staff)
        resp = self.client.post(
            reverse("invoice-send", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 503, resp.data)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "draft")

    def test_client_cannot_send_invoice(self):
        self.client.force_login(self.client_user)
        resp = self.client.post(
            reverse("invoice-send", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 403)

    def test_paid_invoice_cannot_be_sent(self):
        self.invoice.status = "paid"
        self.invoice.save(update_fields=["status"])
        self.client.force_login(self.staff)
        resp = self.client.post(
            reverse("invoice-send", kwargs={"project_pk": self.project.pk, "pk": self.invoice.pk}),
            {}, format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.data)


class InvoiceWebhookTests(InvoiceTestBase):
    def _event(self, event_type, obj):
        return {"id": "evt_test", "type": event_type, "data": {"object": obj}}

    def test_checkout_completed_marks_paid(self):
        handle_invoice_event(self._event("checkout.session.completed", {
            "id": "cs_test_1",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
            "payment_intent": "pi_test_1",
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")
        self.assertEqual(self.invoice.stripe_payment_intent_id, "pi_test_1")
        self.assertIsNotNone(self.invoice.paid_at)

    def test_payment_intent_succeeded_marks_paid(self):
        handle_invoice_event(self._event("payment_intent.succeeded", {
            "id": "pi_test_2",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")
        self.assertEqual(self.invoice.stripe_payment_intent_id, "pi_test_2")

    def test_webhook_falls_back_to_checkout_session_id(self):
        self.invoice.stripe_checkout_session_id = "cs_legacy"
        self.invoice.save(update_fields=["stripe_checkout_session_id"])
        handle_invoice_event(self._event("checkout.session.completed", {
            "id": "cs_legacy", "metadata": {}, "payment_intent": "pi_test_3",
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")

    def test_repeated_webhook_is_idempotent(self):
        event = self._event("checkout.session.completed", {
            "id": "cs_dup",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
            "payment_intent": "pi_dup",
        })
        handle_invoice_event(event)
        self.invoice.refresh_from_db()
        first_paid_at = self.invoice.paid_at
        self.assertIsNotNone(first_paid_at)
        handle_invoice_event(event)
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")
        self.assertEqual(self.invoice.paid_at, first_paid_at)

    def test_expired_session_marks_overdue_not_paid(self):
        self.invoice.status = "sent"
        self.invoice.save(update_fields=["status"])
        handle_invoice_event(self._event("checkout.session.expired", {
            "id": "cs_expired",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "overdue")

    def test_payment_failed_marks_overdue(self):
        self.invoice.status = "sent"
        self.invoice.save(update_fields=["status"])
        handle_invoice_event(self._event("payment_intent.payment_failed", {
            "id": "pi_fail",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "overdue")
        self.assertIsNone(self.invoice.paid_at)

    def test_draft_is_not_downgraded_to_overdue(self):
        handle_invoice_event(self._event("checkout.session.expired", {
            "id": "cs_draft",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "draft")

    def test_paid_invoice_stays_paid_on_failure_event(self):
        self.invoice.status = "paid"
        self.invoice.save(update_fields=["status"])
        handle_invoice_event(self._event("payment_intent.payment_failed", {
            "id": "pi_late",
            "metadata": {"kind": "project_invoice", "invoice_id": str(self.invoice.pk)},
        }))
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "paid")

    def test_product_checkout_webhook_does_not_touch_invoices(self):
        from products.views import WebhookViewSet

        WebhookViewSet().handle_checkout_completed({
            "id": "cs_product",
            "metadata": {"product_id": "1", "license_type": "single"},
            "customer_details": {"email": "ap@acme.test", "name": "AP"},
        })
        self.invoice.refresh_from_db()
        self.assertEqual(self.invoice.status, "draft")

    def test_unknown_invoice_id_is_ignored(self):
        handle_invoice_event(self._event("checkout.session.completed", {
            "id": "cs_unknown",
            "metadata": {"kind": "project_invoice", "invoice_id": "999999"},
        }))
        self.assertEqual(ProjectInvoice.objects.get(pk=self.invoice.pk).status, "draft")

    


class BillingSummaryTests(InvoiceTestBase):
    def test_staff_gets_totals(self):
        ProjectInvoice.objects.create(
            project=self.project, label="Paid", amount=Decimal("1000.00"), status="paid",
        )
        self.invoice.status = "sent"
        self.invoice.save(update_fields=["status"])
        ProjectInvoice.objects.create(
            project=self.project, label="Void", amount=Decimal("999.00"), status="void",
        )
        self.client.force_login(self.staff)
        resp = self.client.get(
            reverse("project-billing-summary", kwargs={"pk": self.project.pk})
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(Decimal(resp.data["paid"]), Decimal("1000.00"))
        self.assertEqual(Decimal(resp.data["outstanding"]), Decimal("4000.00"))
        self.assertEqual(Decimal(resp.data["invoiced"]), Decimal("5000.00"))
        self.assertEqual(Decimal(resp.data["budget"]), Decimal("10000.00"))

    def test_client_cannot_read_billing_summary(self):
        self.client.force_login(self.client_user)
        resp = self.client.get(
            reverse("project-billing-summary", kwargs={"pk": self.project.pk})
        )
        self.assertEqual(resp.status_code, 403)

    def test_outsider_gets_404_not_budget(self):
        self.client.force_login(self.outsider)
        resp = self.client.get(
            reverse("project-billing-summary", kwargs={"pk": self.project.pk})
        )
        self.assertEqual(resp.status_code, 404)


class BudgetRedactionTests(InvoiceTestBase):
    """Budget must not leak to client members through the project endpoints."""

    def test_member_project_list_hides_budget(self):
        self.client.force_login(self.client_user)
        row = self.client.get("/api/projects/").data["results"][0]
        self.assertIsNone(row["budget"])

    def test_member_project_detail_hides_budget(self):
        self.client.force_login(self.client_user)
        resp = self.client.get(f"/api/projects/{self.project.pk}/")
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["budget"])

    def test_member_cannot_force_budget_via_audience_param(self):
        self.client.force_login(self.client_user)
        resp = self.client.get(
            f"/api/projects/{self.project.pk}/dashboard/?audience=client"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["budget"])

    def test_member_cannot_force_budget_via_team_audience(self):
        self.client.force_login(self.client_user)
        resp = self.client.get(
            f"/api/projects/{self.project.pk}/dashboard/?audience=team"
        )
        self.assertEqual(resp.status_code, 200)
        self.assertIsNone(resp.data["budget"])

    def test_staff_still_sees_budget(self):
        self.client.force_login(self.staff)
        resp = self.client.get(f"/api/projects/{self.project.pk}/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(Decimal(resp.data["budget"]), Decimal("10000.00"))