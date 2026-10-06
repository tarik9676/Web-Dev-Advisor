from django.contrib.auth import get_user_model
from rest_framework import serializers

from projects.models import Project, ProjectInvoice, TeamMember


class TeamMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeamMember
        fields = "__all__"
        read_only_fields = ["project", "created_at", "updated_at"]


class ProjectInvoiceSerializer(serializers.ModelSerializer):
    milestone_name = serializers.CharField(source="milestone.name", read_only=True, default="")
    invoice_number = serializers.SerializerMethodField()

    class Meta:
        model = ProjectInvoice
        fields = [
            "id", "invoice_number", "project", "milestone", "milestone_name",
            "label", "description", "amount", "currency", "client_email", "status",
            "due_date", "stripe_checkout_session_id", "stripe_payment_intent_id",
            "paid_at", "created_at", "updated_at",
        ]
        # Money state is webhook-only. Staff can draft and void, never mark paid.
        read_only_fields = [
            "project", "status", "stripe_checkout_session_id",
            "stripe_payment_intent_id", "paid_at", "created_at", "updated_at",
        ]

    def get_invoice_number(self, obj):
        return f"INV-{obj.pk:04d}"

    def validate_milestone(self, value):
        project = self.context.get("project")
        if value is not None and project is not None and value.project_id != project.pk:
            raise serializers.ValidationError("Milestone must belong to the same project.")
        return value

    def validate_amount(self, value):
        if value is None or value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class ProjectMemberSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = get_user_model()
        fields = ["id", "username", "email", "first_name", "last_name", "full_name", "is_staff"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


def redact_budget(instance_data, context):
    """Project budget is staff-only. Client members on the roster must not read
    it off the project endpoint, so it is stripped from every representation
    except for staff."""
    request = context.get("request")
    if request is not None and request.user.is_staff:
        return instance_data
    instance_data["budget"] = None
    return instance_data


class ProjectSerializer(serializers.ModelSerializer):
    team_members = TeamMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = "__all__"
        # `members` is managed by staff through the members action, not by a
        # project member editing their own project.
        read_only_fields = ["members", "created_at", "updated_at"]

    def to_representation(self, instance):
        return redact_budget(super().to_representation(instance), self.context)


class ProjectDashboardSerializer(serializers.ModelSerializer):
    team_members = TeamMemberSerializer(many=True, read_only=True)
    milestones = serializers.SerializerMethodField()
    workstreams = serializers.SerializerMethodField()
    tasks = serializers.SerializerMethodField()
    risks = serializers.SerializerMethodField()
    approval_gates = serializers.SerializerMethodField()
    decisions = serializers.SerializerMethodField()
    blockers = serializers.SerializerMethodField()
    client_decisions = serializers.SerializerMethodField()
    launch_readiness = serializers.SerializerMethodField()
    next_actions = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def get_milestones(self, obj):
        from workstreams.serializers import MilestoneSerializer

        return MilestoneSerializer(obj.milestones.all(), many=True, context=self.context).data

    def get_workstreams(self, obj):
        from workstreams.serializers import WorkstreamSerializer

        return WorkstreamSerializer(obj.workstreams.all(), many=True, context=self.context).data

    def get_tasks(self, obj):
        from workstreams.models import Task
        from workstreams.serializers import TaskSerializer

        tasks = Task.objects.select_related("assignee", "reviewer", "workstream").filter(
            workstream__project=obj
        )
        return TaskSerializer(tasks, many=True, context=self.context).data

    def get_risks(self, obj):
        from governance.serializers import RiskSerializer

        return RiskSerializer(obj.risks.all(), many=True, context=self.context).data

    def get_approval_gates(self, obj):
        from governance.serializers import ApprovalGateSerializer

        return ApprovalGateSerializer(obj.approval_gates.all(), many=True, context=self.context).data

    def get_decisions(self, obj):
        from governance.serializers import DecisionLogSerializer

        return DecisionLogSerializer(obj.decisions.all(), many=True, context=self.context).data

    def get_blockers(self, obj):
        from workstreams.models import Task

        blocked_workstreams = obj.workstreams.filter(status="blocked")
        blocked_tasks = Task.objects.filter(workstream__project=obj, status="blocked")
        return {
            "blocked_workstreams": list(blocked_workstreams.values("id", "name")),
            "blocked_tasks": list(
                blocked_tasks.values("id", "title", "priority", "client_input_required")
            ),
        }

    def get_client_decisions(self, obj):
        from governance.serializers import DecisionLogSerializer

        return DecisionLogSerializer(
            obj.decisions.filter(client_visible=True), many=True, context=self.context
        ).data

    def get_launch_readiness(self, obj):
        total_milestones = obj.milestones.count()
        if not total_milestones:
            return 0
        completed = obj.milestones.filter(status="completed").count()
        return round((completed / total_milestones) * 100)

    def get_next_actions(self, obj):
        from workstreams.models import Task

        actions = []
        actions.extend(
            {
                "type": "workstream",
                "id": ws.id,
                "title": f"Continue workstream: {ws.name}",
                "status": ws.status,
            }
            for ws in obj.workstreams.filter(status="in_progress")
        )
        actions.extend(
            {
                "type": "task",
                "id": task.id,
                "title": f"Task in progress: {task.title}",
                "status": task.status,
            }
            for task in Task.objects.filter(workstream__project=obj, status="in_progress")
        )
        actions.extend(
            {
                "type": "approval",
                "id": gate.id,
                "title": f"Approval pending: {gate.name}",
                "status": gate.status,
            }
            for gate in obj.approval_gates.filter(status="pending")
        )
        actions.extend(
            {
                "type": "risk",
                "id": risk.id,
                "title": f"Mitigating risk: {risk.title}",
                "status": risk.status,
            }
            for risk in obj.risks.filter(status="mitigating", severity__in=["critical", "high"])
        )
        return actions[:12] or [{"type": "none", "id": None, "title": "No urgent actions", "status": "done"}]

    def to_representation(self, instance):
        data = redact_budget(super().to_representation(instance), self.context)
        if self.context.get("audience") != "client":
            return data

        data["team_members"] = [
            member for member in data["team_members"]
            if member.get("client_access") and member.get("kind") == "human"
        ]
        data["workstreams"] = [
            {
                key: value
                for key, value in workstream.items()
                if key not in {"ai_assistants", "ai_assistant_ids", "inputs", "acceptance_criteria"}
            }
            for workstream in data["workstreams"]
        ]
        client_task_fields = {
            "id", "title", "description", "priority", "status", "due_date",
            "definition_of_done", "client_input_required", "client_input_text",
            "staging_reference", "assignee", "reviewer",
        }
        data["tasks"] = [
            {key: value for key, value in task.items() if key in client_task_fields}
            for task in data["tasks"]
            if not task.get("description", "").startswith("Internal-only")
        ]
        data["risks"] = [risk for risk in data["risks"] if risk.get("client_visible")]
        data["approval_gates"] = [
            {key: value for key, value in gate.items() if key != "notes"}
            for gate in data["approval_gates"]
        ]
        data["decisions"] = [decision for decision in data["decisions"] if decision.get("client_visible")]
        data["client_decisions"] = data["decisions"]
        data["blockers"]["blocked_tasks"] = [
            task for task in data["blockers"]["blocked_tasks"]
            if task.get("client_input_required")
        ]
        return data
