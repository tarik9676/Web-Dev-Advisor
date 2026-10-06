from django.test import TestCase

from projects.models import Project, TeamMember
from workstreams.models import Workstream, Task


class WorkstreamModelTests(TestCase):
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

    def test_ai_cannot_be_workstream_owner(self):
        ws = Workstream(
            project=self.project, name="Test", slug="test",
            human_owner=self.ai,
        )
        self.assertRaises(Exception, ws.full_clean)

    def test_human_can_be_workstream_owner(self):
        ws = Workstream(
            project=self.project, name="Test", slug="test",
            human_owner=self.human,
        )
        ws.full_clean()
        self.assertTrue(True)


class TaskModelTests(TestCase):
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
        self.ws = Workstream.objects.create(
            project=self.project, name="Test", slug="test",
            human_owner=self.human,
        )

    def test_ai_cannot_be_task_reviewer(self):
        t = Task(
            workstream=self.ws, title="Test",
            assignee=self.human, reviewer=self.ai,
        )
        self.assertRaises(Exception, t.full_clean)

    def test_human_can_be_task_reviewer(self):
        t = Task(
            workstream=self.ws, title="Test",
            assignee=self.human, reviewer=self.human,
        )
        t.full_clean()
        self.assertTrue(True)
