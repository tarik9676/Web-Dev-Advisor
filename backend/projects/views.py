from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView

import calendar
from datetime import datetime
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Q, Sum
from django.db.models.functions import TruncMonth
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Client, Project, ProjectInvoice, TeamMember
from .serializers import (
    ClientSerializer,
    ProjectDashboardSerializer,
    ProjectInvoiceSerializer,
    ProjectMemberSerializer,
    ProjectSerializer,
    TeamMemberSerializer,
)
from . import stripe_billing


User = get_user_model()


def membership_filter(user, prefix=""):
    """Restrict a queryset to projects the user belongs to. Staff and superusers
    see everything, since they are the team that opens and administers projects."""
    if user.is_superuser or user.is_staff:
        return Q()
    return Q(**{f"{prefix}members": user})


def visible_projects(user):
    return Project.objects.filter(membership_filter(user))


class ProjectViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    queryset = Project.objects.prefetch_related(
        "team_members",
        "workstreams",
        "milestones",
        "approval_gates",
        "risks",
        "decisions",
    ).all()
    serializer_class = ProjectSerializer
    filterset_fields = ["status", "client_name", "project_name"]
    search_fields = ["client_name", "project_name", "slug"]
    ordering_fields = ["created_at", "launch_date", "deadline", "budget"]
    ordering = ["-created_at"]

    def get_permissions(self):
        # Projects are opened by staff, never by clients. Client accounts are
        # read-only participants that get added to a project by staff.
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        # Falls through to the action's own permission_classes, so actions that
        # declare their own (members) are not silently downgraded here.
        return super().get_permissions()

    def get_queryset(self):
        return super().get_queryset().filter(membership_filter(self.request.user))

    def perform_create(self, serializer):
        project = serializer.save()
        project.members.add(self.request.user)

    @action(detail=True, methods=["get", "post", "delete"], permission_classes=[IsAdminUser])
    def members(self, request, pk=None):
        """Manage who can open this project. Replaces the writable `members`
        serializer field, which let any member grant themselves access."""
        project = self.get_object()
        if request.method == "GET":
            return Response(ProjectMemberSerializer(project.members.all(), many=True).data)
        if request.method == "POST":
            user = User.objects.filter(
                Q(pk=request.data.get("user_id")) | Q(username=request.data.get("username", ""))
            ).first()
            if user is None:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
            project.members.add(user)
            return Response(ProjectMemberSerializer(user).data, status=status.HTTP_201_CREATED)
        user = User.objects.filter(pk=request.data.get("user_id")).first()
        if user is not None:
            project.members.remove(user)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def get_serializer_class(self):
        if self.action == "dashboard":
            return ProjectDashboardSerializer
        return ProjectSerializer

    @action(detail=True, methods=["get"])
    def dashboard(self, request, pk=None):
        project = self.get_object()
        audience = request.query_params.get("audience", "team")
        if audience not in ("team", "client"):
            return Response(
                {"error": "audience must be 'team' or 'client'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # The team audience is the unredacted internal picture: AI assistants,
        # workstream inputs, acceptance criteria, Internal-only work, risks and
        # decisions flagged internal, and approval-gate notes. Client members are
        # pinned to the client audience here rather than trusted to ask for it, so
        # the audience toggle can never become a way to read internal state.
        if not (request.user.is_staff or request.user.is_superuser):
            audience = "client"
        serializer = ProjectDashboardSerializer(
            project,
            context={"request": request, "audience": audience},
        )
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def billing_summary(self, request, pk=None):
        """Money position for the project. Staff-only: budget and invoice
        amounts are not exposed to client members."""
        project = self.get_object()
        if not request.user.is_staff:
            return Response(
                {"error": "Billing is staff-only."}, status=status.HTTP_403_FORBIDDEN
            )
        invoices = project.invoices.exclude(status="void")
        # filter and exclude cannot be mixed in one aggregate() call, so the
        # paid total and the outstanding total are computed separately.
        paid = invoices.filter(status="paid").aggregate(total=Sum("amount"))["total"]
        invoiced = invoices.aggregate(total=Sum("amount"))["total"]
        by_status = {
            row["status"]: row["total"]
            for row in invoices.values("status").annotate(total=Sum("amount"))
        }
        invoiced = invoiced or Decimal("0.00")
        paid = paid or Decimal("0.00")
        return Response({
            "project_id": project.pk,
            "budget": project.budget,
            "currency": project.currency,
            "invoiced": f"{invoiced:.2f}",
            "paid": f"{paid:.2f}",
            "outstanding": f"{invoiced - paid:.2f}",
            "by_status": by_status,
        })


def money(value):
    return f"{value or Decimal('0.00'):.2f}"


class BillingAnalyticsView(APIView):
    """Income and growth analytics across every project the staff
    member can see. Money figures are staff-only, like every other
    billing surface."""

    permission_classes = [IsAuthenticated]
    MONTHS = 12

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Billing analytics is staff-only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        invoices = ProjectInvoice.objects.filter(
            project__in=visible_projects(request.user),
        ).exclude(status="void")
        paid = invoices.filter(status="paid")

        invoiced_total = invoices.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        paid_total = paid.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")
        budget_total = visible_projects(request.user).aggregate(
            total=Sum("budget"),
        )["total"]
        by_currency = {
            row["currency"]: money(row["total"])
            for row in paid.values("currency").annotate(total=Sum("amount"))
        }
        primary_currency = max(
            by_currency.items(), key=lambda item: Decimal(item[1]), default=None,
        )
        primary_currency = primary_currency[0] if primary_currency else "USD"

        # Monthly buckets over the trailing window, per currency. Paid is
        # bucketed by the moment money landed (paid_at), invoiced by when
        # the installment was issued (created_at).
        now = timezone.now()
        base = now.year * 12 + now.month - 1
        start_index = base - (self.MONTHS - 1)
        periods = []
        for index in range(start_index, base + 1):
            year, month_index = divmod(index, 12)
            month = month_index + 1
            periods.append({
                "period": f"{year}-{month:02d}",
                "label": calendar.month_abbr[month],
            })
        window_start = datetime(
            start_index // 12, start_index % 12 + 1, 1, tzinfo=timezone.utc,
        )
        paid_rows = (
            paid.filter(paid_at__gte=window_start)
            .annotate(month=TruncMonth("paid_at"))
            .values("month", "currency")
            .annotate(total=Sum("amount"))
        )
        invoiced_rows = (
            invoices.filter(created_at__gte=window_start)
            .annotate(month=TruncMonth("created_at"))
            .values("month", "currency")
            .annotate(total=Sum("amount"))
        )
        monthly = {}
        for period in periods:
            monthly[period["period"]] = {
                "period": period["period"],
                "label": period["label"],
                "paid": {},
                "invoiced": {},
            }
        for row in paid_rows:
            key = row["month"].strftime("%Y-%m")
            if key in monthly:
                monthly[key]["paid"][row["currency"]] = money(row["total"])
        for row in invoiced_rows:
            key = row["month"].strftime("%Y-%m")
            if key in monthly:
                monthly[key]["invoiced"][row["currency"]] = money(row["total"])

        # Growth compares the two most recent months of the window in the
        # currency that carries the most paid volume.
        def paid_in(period_key):
            return Decimal(monthly[period_key]["paid"].get(primary_currency, "0.00"))

        current_period = periods[-1]["period"]
        previous_period = periods[-2]["period"]
        current = paid_in(current_period)
        previous = paid_in(previous_period)
        percent = None
        if previous > 0:
            percent = round(float((current - previous) / previous * 100), 1)
        growth = {
            "current_period": current_period,
            "current_label": periods[-1]["label"],
            "previous_period": previous_period,
            "previous_label": periods[-2]["label"],
            "current": money(current),
            "previous": money(previous),
            "percent": percent,
            "direction": "up" if current > previous else "down" if current < previous else "flat",
        }

        top_clients = sorted(
            (
                {
                    "client_name": row["project__client_name"] or "Unassigned",
                    "paid": money(row["total"]),
                    "currency": row["currency"],
                }
                for row in paid.values("project__client_name", "currency")
                .annotate(total=Sum("amount"))
            ),
            key=lambda item: Decimal(item["paid"]),
            reverse=True,
        )[:5]

        by_status = {
            row["status"]: money(row["total"])
            for row in invoices.values("status").annotate(total=Sum("amount"))
        }
        return Response({
            "totals": {
                "budget": money(budget_total) if budget_total is not None else None,
                "currency": primary_currency,
                "invoiced": money(invoiced_total),
                "paid": money(paid_total),
                "outstanding": money(invoiced_total - paid_total),
                "invoice_count": invoices.count(),
                "paid_count": paid.count(),
                "by_currency": by_currency,
            },
            "growth": growth,
            "monthly": list(monthly.values()),
            "by_status": by_status,
            "top_clients": top_clients,
        })


class GlobalInvoiceListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "This view is staff-only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        queryset = ProjectInvoice.objects.filter(
            project__in=visible_projects(request.user),
        ).select_related("project", "milestone").order_by("-created_at")

        page_size = min(int(request.query_params.get("page_size", 50)), 100)
        page = max(int(request.query_params.get("page", 1)), 1)
        start = (page - 1) * page_size
        end = start + page_size

        invoices = queryset[start:end]
        serializer = ProjectInvoiceSerializer(invoices, many=True)
        return Response({
            "count": queryset.count(),
            "results": serializer.data,
        })


class ProjectInvoiceViewSet(ModelViewSet):
    """Staff-issued invoices. Clients never write to these; staff never mark
    them paid by hand. Status is webhook-driven, so create/update accept only
    draft content and a staff-explicit void."""

    permission_classes = [IsAuthenticated]
    serializer_class = ProjectInvoiceSerializer
    filterset_fields = ["project", "status", "milestone", "currency"]
    search_fields = ["label", "description"]
    ordering_fields = ["due_date", "amount", "created_at", "status"]
    ordering = ["-created_at"]

    STAFF_ONLY_ACTIONS = (
        "create", "update", "partial_update", "destroy", "send", "void",
    )

    def get_queryset(self):
        queryset = ProjectInvoice.objects.select_related("project", "milestone")
        project_pk = self.kwargs.get("project_pk")
        if project_pk is not None:
            queryset = queryset.filter(project_id=project_pk)
        queryset = queryset.filter(
            membership_filter(self.request.user, prefix="project__")
        )
        if not self.request.user.is_staff:
            # Client members see only invoices that were actually sent, never drafts.
            queryset = queryset.exclude(status="draft")
        return queryset

    def get_permissions(self):
        # Checked by action name rather than by @action(permission_classes=...),
        # because these routes are wired through explicit as_view() mappings and
        # the router does not forward decorator kwargs to the view instance.
        if self.action in self.STAFF_ONLY_ACTIONS:
            return [IsAdminUser()]
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project"] = self._project_from_request()
        return context

    def _project_from_request(self):
        pk = self.kwargs.get("project_pk")
        if pk is None:
            return None
        return Project.objects.filter(
            pk=pk
        ).filter(membership_filter(self.request.user)).first()

    def _project_for_create(self):
        """Detail routes resolve the project from the invoice; the nested list
        route resolves it from the URL."""
        if self.kwargs.get("pk") and self.action == "create":
            return None
        return self._project_from_request()

    def perform_create(self, serializer):
        project = self._project_for_create()
        if project is None:
            raise NotFound("Project not found.")
        serializer.save(project=project, status="draft")

    def perform_update(self, serializer):
        # Paid is webhook-only. Voiding is a human decision, so it is the one
        # status staff may set by hand.
        requested = self.request.data.get("status")
        if requested == "paid":
            raise ValidationError({
                "status": "Paid status comes from the Stripe webhook and cannot be set manually."
            })
        serializer.save()

    def _scoped_object(self, pk):
        """Detail routes carry the project in the URL. Refuse an invoice that
        belongs to a different project than the one addressed."""
        invoice = self.get_queryset().filter(pk=pk).first()
        if invoice is None:
            raise NotFound("Invoice not found.")
        project_pk = self.kwargs.get("project_pk")
        if project_pk is not None and str(invoice.project_id) != str(project_pk):
            raise NotFound("Invoice not found.")
        return invoice

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None, **kwargs):
        """Create the Stripe Checkout link and move the invoice to sent."""
        invoice = self._scoped_object(pk)
        if invoice.status in ("paid", "void"):
            return Response(
                {"error": f"Cannot send a {invoice.status} invoice."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not stripe_billing.stripe_configured():
            return Response(
                {"error": "Stripe not configured"}, status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        try:
            url, session_id = stripe_billing.create_checkout_session(invoice, request=request)
        except RuntimeError as exc:
            return Response({"error": str(exc)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        except Exception as exc:  # stripe.error.StripeError
            return Response(
                {"error": str(exc)}, status=status.HTTP_400_BAD_REQUEST
            )
        invoice.refresh_from_db()
        return Response({
            "invoice": ProjectInvoiceSerializer(invoice, context=self.get_serializer_context()).data,
            "checkout_url": url,
            "session_id": session_id,
        })

    @action(detail=True, methods=["post"])
    def void(self, request, pk=None, **kwargs):
        invoice = self._scoped_object(pk)
        if invoice.status == "paid":
            return Response(
                {"error": "A paid invoice cannot be voided."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        invoice.status = "void"
        invoice.save(update_fields=["status", "updated_at"])
        return Response(ProjectInvoiceSerializer(invoice, context=self.get_serializer_context()).data)


class TeamMemberViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TeamMemberSerializer
    filterset_fields = ["project", "kind", "role", "client_access", "is_active"]
    search_fields = ["name", "email"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_queryset(self):
        return TeamMember.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_pk"))


class ClientViewSet(ModelViewSet):
    """Client profiles. Staff manage clients; they're referenced by projects.
    Each client has a linked user account for read-only project access."""
    permission_classes = [IsAuthenticated]
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    search_fields = ["name", "email", "company"]
    ordering_fields = ["name", "created_at"]
    ordering = ["name"]

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        user = instance.user
        instance.delete()
        if user:
            user.delete()
