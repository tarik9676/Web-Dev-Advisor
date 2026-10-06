from rest_framework import serializers

from projects.models import TeamMember
from projects.serializers import TeamMemberSerializer
from .models import Workstream, Task, Milestone


class WorkstreamSerializer(serializers.ModelSerializer):
    human_owner = TeamMemberSerializer(read_only=True)
    human_owner_id = serializers.PrimaryKeyRelatedField(
        source="human_owner",
        queryset=TeamMember.objects.all(),
        write_only=True,
    )
    contributors = TeamMemberSerializer(many=True, read_only=True)
    contributor_ids = serializers.PrimaryKeyRelatedField(
        source="contributors",
        queryset=TeamMember.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    ai_assistants = TeamMemberSerializer(many=True, read_only=True)
    ai_assistant_ids = serializers.PrimaryKeyRelatedField(
        source="ai_assistants",
        queryset=TeamMember.objects.filter(kind="ai"),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Workstream
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]

    def to_internal_value(self, data):
        data = data.copy()
        aliases = {
            "human_owner": "human_owner_id",
            "contributors": "contributor_ids",
            "ai_assistants": "ai_assistant_ids",
        }
        for source, target in aliases.items():
            if source in data and target not in data:
                data[target] = data.pop(source)
        return super().to_internal_value(data)

    def validate_human_owner(self, value):
        project_id = self.context.get("project_id")
        if project_id and value.project_id != int(project_id):
            raise serializers.ValidationError("Owner must belong to this project.")
        if value.kind != "human":
            raise serializers.ValidationError("AI members cannot own a workstream.")
        return value


class TaskSerializer(serializers.ModelSerializer):
    assignee = TeamMemberSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        source="assignee",
        queryset=TeamMember.objects.all(),
        write_only=True,
    )
    reviewer = TeamMemberSerializer(read_only=True)
    reviewer_id = serializers.PrimaryKeyRelatedField(
        source="reviewer",
        queryset=TeamMember.objects.filter(kind="human"),
        write_only=True,
        required=False,
        allow_null=True,
    )
    dependencies = serializers.SerializerMethodField()
    dependency_ids = serializers.PrimaryKeyRelatedField(
        source="dependencies",
        queryset=Task.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    class Meta:
        model = Task
        fields = "__all__"
        read_only_fields = ["workstream", "created_at", "updated_at"]

    def to_internal_value(self, data):
        data = data.copy()
        aliases = {
            "assignee": "assignee_id",
            "reviewer": "reviewer_id",
            "dependencies": "dependency_ids",
        }
        for source, target in aliases.items():
            if source in data and target not in data:
                data[target] = data.pop(source)
        return super().to_internal_value(data)

    def get_dependencies(self, obj):
        return list(obj.dependencies.values_list("id", flat=True))

    def validate_assignee(self, value):
        workstream_id = self.context.get("workstream_id")
        if workstream_id and value.project_id != Workstream.objects.values_list(
            "project_id", flat=True
        ).get(id=workstream_id):
            raise serializers.ValidationError("Assignee must belong to this project.")
        return value

    def validate_reviewer(self, value):
        if value and value.kind != "human":
            raise serializers.ValidationError("Task reviewer must be a human.")
        return value


class MilestoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Milestone
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]
