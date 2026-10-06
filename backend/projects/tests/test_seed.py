from django.core.management import call_command
from django.test import TestCase

from projects.models import Project, TeamMember
from workstreams.models import Workstream, Task, Milestone
from governance.models import ApprovalGate, Risk, DecisionLog


class SeedDemoProjectTests(TestCase):
    def test_seed_is_idempotent(self):
        call_command("seed_demo_project")
        p1 = Project.objects.get(slug="demo-woocommerce-agency")
        call_command("seed_demo_project")
        p2 = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p1.id, p2.id)

    def test_seed_creates_project(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.client_name, "Demo Client")
        self.assertEqual(p.project_name, "WooCommerce Store Launch")
        self.assertEqual(p.budget, 45000.00)

    def test_seed_creates_members(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        total = p.team_members.count()
        humans = p.team_members.filter(kind="human").count()
        ais = p.team_members.filter(kind="ai").count()
        self.assertEqual(total, 22)
        self.assertEqual(humans, 10)
        self.assertEqual(ais, 12)

    def test_seed_creates_workstreams(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.workstreams.count(), 15)

    def test_seed_workstreams_have_human_owners(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        for ws in p.workstreams.all():
            self.assertEqual(ws.human_owner.kind, "human")

    def test_seed_creates_milestones(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.milestones.count(), 8)

    def test_seed_creates_approval_gates(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.approval_gates.count(), 10)
        for g in p.approval_gates.all():
            self.assertEqual(g.approver.kind, "human")

    def test_seed_creates_risks(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.risks.count(), 10)

    def test_seed_creates_decisions(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        self.assertEqual(p.decisions.count(), 9)

    def test_seed_creates_tasks(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        ws = p.workstreams.get(slug="qa")
        self.assertGreaterEqual(ws.tasks.count(), 1)

    def test_seed_client_visible_data(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        client_visible_risks = p.risks.filter(client_visible=True).count()
        internal_risks = p.risks.filter(client_visible=False).count()
        self.assertGreater(client_visible_risks, 0)
        self.assertGreater(internal_risks, 0)

    def test_seed_ai_assistants_on_workstreams(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        ws_with_ai = p.workstreams.filter(ai_assistants__isnull=False).distinct()
        self.assertGreater(ws_with_ai.count(), 0)

    def test_seed_workstream_contributors(self):
        call_command("seed_demo_project")
        p = Project.objects.get(slug="demo-woocommerce-agency")
        ws_with_contrib = p.workstreams.filter(contributors__isnull=False).distinct()
        self.assertGreater(ws_with_contrib.count(), 0)
