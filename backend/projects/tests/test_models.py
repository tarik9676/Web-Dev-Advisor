from django.test import TestCase

from projects.models import Project, TeamMember


class TeamMemberModelTests(TestCase):
    def setUp(self):
        self.project = Project.objects.create(
            client_name="Test Client", project_name="Test Project",
            slug="test-project",
        )

    def test_human_member_can_be_created(self):
        m = TeamMember.objects.create(
            project=self.project, name="Alice", role="developer", kind="human",
        )
        self.assertEqual(m.kind, "human")

    def test_ai_member_can_be_created(self):
        m = TeamMember.objects.create(
            project=self.project, name="Bot", role="qa_agent", kind="ai",
        )
        self.assertEqual(m.kind, "ai")
