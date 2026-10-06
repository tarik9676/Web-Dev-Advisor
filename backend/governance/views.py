from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from projects.views import membership_filter
from .models import Risk, ApprovalGate, DecisionLog
from .serializers import RiskSerializer, ApprovalGateSerializer, DecisionLogSerializer


class ApprovalGateViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ApprovalGateSerializer
    filterset_fields = ["project", "decision_type", "status"]
    search_fields = ["name"]
    ordering_fields = ["created_at", "status"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return ApprovalGate.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        approver = serializer.validated_data.get("approver")
        if approver and approver.kind != "human":
            from rest_framework.exceptions import ValidationError
            raise ValidationError({
                "approver": "Client-facing, financial, security, production, and scope decisions require a named human approver."
            })
        serializer.save(project_id=self.kwargs.get("project_pk"))


class RiskViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = RiskSerializer
    filterset_fields = ["project", "severity", "category", "status", "client_visible"]
    search_fields = ["title"]
    ordering_fields = ["severity", "created_at"]
    ordering = ["-severity"]

    def get_queryset(self):
        return Risk.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_pk"))


class DecisionLogViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = DecisionLogSerializer
    filterset_fields = ["project", "decision_type", "outcome", "client_visible"]
    search_fields = ["title"]
    ordering_fields = ["created_at", "outcome"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return DecisionLog.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_pk"))
