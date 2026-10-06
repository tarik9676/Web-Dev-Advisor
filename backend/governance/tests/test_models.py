from django.test import TestCase

from projects.models import Project, TeamMember
from governance.models import ApprovalGate


class ApprovalGateModelTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(
            client_name="Test Client", project_name="Test Project",
            slug="test-project",
        )
        self.human = TeamMember.objects.create(
            project=self.project, name="Alice", role="developer", kind="human",
        )
        self.ai = TeamMember.objects.create(
            project=self.project, name="Bot", role="qa_agent", kind="ai",
        )

    def test_ai_cannot_be_gate_approver(self):
        g = ApprovalGate(
            project=self.project, name="Gate", decision_type="production",
            approver=self.ai,
        )
        self.assertRaises(Exception, g.full_clean)

    def test_human_can_be_gate_approver(self):
        g = ApprovalGate(
            project=self.project, name="Gate", decision_type="production",
            approver=self.human,
        )
        g.full_clean()
        self.assertTrue(True)
