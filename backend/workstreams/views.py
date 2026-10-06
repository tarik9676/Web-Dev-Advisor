from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from projects.views import membership_filter
from .models import Workstream, Task, Milestone
from .serializers import WorkstreamSerializer, TaskSerializer, MilestoneSerializer


class WorkstreamViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WorkstreamSerializer
    filterset_fields = ["project", "status"]
    search_fields = ["name"]
    ordering_fields = ["order", "created_at"]
    ordering = ["order"]

    def get_queryset(self):
        return Workstream.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        human_owner = serializer.validated_data.get("human_owner")
        if human_owner and human_owner.kind != "human":
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"human_owner": "AI members cannot own a workstream."})
        serializer.save(project_id=self.kwargs.get("project_pk"))


class TaskViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer
    filterset_fields = ["workstream", "status", "priority", "assignee"]
    search_fields = ["title"]
    ordering_fields = ["due_date", "priority", "created_at"]
    ordering = ["-due_date"]

    def get_queryset(self):
        return Task.objects.filter(
            workstream_id=self.kwargs.get("workstream_pk")
        ).filter(membership_filter(self.request.user, prefix="workstream__project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["workstream_id"] = self.kwargs.get("workstream_pk")
        return context

    def perform_create(self, serializer):
        reviewer = serializer.validated_data.get("reviewer")
        if reviewer and reviewer.kind != "human":
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"reviewer": "Task reviewer must be a human."})
        serializer.save(workstream_id=self.kwargs.get("workstream_pk"))


class MilestoneViewSet(ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = MilestoneSerializer
    filterset_fields = ["project", "phase", "status"]
    search_fields = ["name"]
    ordering_fields = ["phase", "target_date", "created_at"]
    ordering = ["phase"]

    def get_queryset(self):
        return Milestone.objects.filter(
            project_id=self.kwargs.get("project_pk")
        ).filter(membership_filter(self.request.user, prefix="project__"))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["project_id"] = self.kwargs.get("project_pk")
        return context

    def perform_create(self, serializer):
        serializer.save(project_id=self.kwargs.get("project_pk"))
