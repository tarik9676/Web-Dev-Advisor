from rest_framework import serializers

from projects.models import TeamMember
from projects.serializers import TeamMemberSerializer
from .models import Risk, ApprovalGate, DecisionLog


class RiskSerializer(serializers.ModelSerializer):
    owner = TeamMemberSerializer(read_only=True)
    owner_id = serializers.PrimaryKeyRelatedField(
        source="owner",
        queryset=TeamMember.objects.filter(kind="human"),
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Risk
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]


class ApprovalGateSerializer(serializers.ModelSerializer):
    approver = TeamMemberSerializer(read_only=True)
    approver_id = serializers.PrimaryKeyRelatedField(
        source="approver",
        queryset=TeamMember.objects.filter(kind="human"),
        write_only=True,
    )

    def to_internal_value(self, data):
        data = data.copy()
        if "approver" in data and "approver_id" not in data:
            data["approver_id"] = data.pop("approver")
        return super().to_internal_value(data)

    class Meta:
        model = ApprovalGate
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]

    def validate_approver(self, value):
        project_id = self.context.get("project_id")
        if project_id and value.project_id != int(project_id):
            raise serializers.ValidationError("Approver must belong to this project.")
        return value


class DecisionLogSerializer(serializers.ModelSerializer):
    decision_maker = TeamMemberSerializer(read_only=True)
    decision_maker_id = serializers.PrimaryKeyRelatedField(
        source="decision_maker",
        queryset=TeamMember.objects.all(),
        write_only=True,
    )

    def to_internal_value(self, data):
        data = data.copy()
        if "decision_maker" in data and "decision_maker_id" not in data:
            data["decision_maker_id"] = data.pop("decision_maker")
        return super().to_internal_value(data)

    class Meta:
        model = DecisionLog
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]

    def validate_decision_maker(self, value):
        project_id = self.context.get("project_id")
        if project_id and value.project_id != int(project_id):
            raise serializers.ValidationError("Decision maker must belong to this project.")
        if value.kind != "human":
            raise serializers.ValidationError("A human must own project decisions.")
        return value
