from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from projects.models import Project, TeamMember
from workstreams.models import Task, Workstream
from governance.models import ApprovalGate, DecisionLog, Risk


User = get_user_model()


class ValidationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Test", project_name="Test", slug="val-project",
        )
        self.user = User.objects.create_user(username="validator", password="correct-horse-9")
        self.project.members.add(self.user)
        self.client.force_login(self.user)
        self.human = TeamMember.objects.create(
            project=self.project, name="Alice", role="developer", kind="human",
        )
        self.ai = TeamMember.objects.create(
            project=self.project, name="Bot", role="qa_agent", kind="ai",
        )
        self.ws = Workstream.objects.create(
            project=self.project, name="WS", slug="ws",
            human_owner=self.human,
        )

    def test_create_workstream_with_ai_owner_fails(self):
        url = reverse("workstream-list", kwargs={"project_pk": self.project.pk})
        data = {
            "name": "Bad WS", "slug": "bad-ws",
            "human_owner": self.ai.pk,
        }
        resp = self.client.post(url, data, format="json")
        self.assertIn(resp.status_code, [400, 406])

    def test_create_approval_gate_with_ai_approver_fails(self):
        url = reverse("approvalgate-list", kwargs={"project_pk": self.project.pk})
        data = {
            "name": "Bad Gate", "decision_type": "production",
            "approver": self.ai.pk,
        }
        resp = self.client.post(url, data, format="json")
        self.assertIn(resp.status_code, [400, 406])

    def test_create_task_with_ai_reviewer_fails(self):
        url = reverse("task-list", kwargs={"workstream_pk": self.ws.pk})
        data = {
            "title": "Bad Task", "assignee": self.human.pk,
            "reviewer": self.ai.pk,
        }
        resp = self.client.post(url, data, format="json")
        self.assertIn(resp.status_code, [400, 406])

    def test_create_workstream_with_human_owner_succeeds(self):
        url = reverse("workstream-list", kwargs={"project_pk": self.project.pk})
        data = {
            "name": "Good WS", "slug": "good-ws",
            "human_owner": self.human.pk,
        }
        resp = self.client.post(url, data, format="json")
        self.assertIn(resp.status_code, [201, 200])


class ResourceAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Test", project_name="Test", slug="res-project",
        )
        self.user = User.objects.create_user(username="resourcer", password="correct-horse-9")
        self.project.members.add(self.user)
        self.client.force_login(self.user)
        self.human = TeamMember.objects.create(
            project=self.project, name="Alice", role="developer", kind="human",
        )
        self.ai = TeamMember.objects.create(
            project=self.project, name="Bot", role="qa_agent", kind="ai",
        )
        self.ws = Workstream.objects.create(
            project=self.project, name="WS", slug="ws",
            human_owner=self.human,
        )

    def test_team_member_crud(self):
        url = reverse("team-member-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {"name": "Bob", "role": "developer", "kind": "human"}, format="json")
        self.assertIn(resp.status_code, [201, 200])

        members = self.client.get(url)
        self.assertEqual(members.status_code, 200)
        self.assertEqual(members.data["count"], 3)

    def test_workstream_crud(self):
        url = reverse("workstream-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {"name": "WS2", "slug": "ws2", "human_owner": self.human.pk}, format="json")
        self.assertIn(resp.status_code, [201, 200])

        ws_id = resp.data.get("id")
        detail_url = reverse("workstream-detail", kwargs={"project_pk": self.project.pk, "pk": ws_id})
        resp = self.client.get(detail_url)
        self.assertEqual(resp.status_code, 200)

        resp = self.client.delete(detail_url)
        self.assertIn(resp.status_code, [204, 200])

    def test_task_crud(self):
        url = reverse("task-list", kwargs={"workstream_pk": self.ws.pk})
        resp = self.client.post(url, {
            "title": "Test task", "assignee": self.human.pk,
            "reviewer": self.human.pk,
        }, format="json")
        self.assertIn(resp.status_code, [201, 200])

    def test_milestone_crud(self):
        url = reverse("milestone-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {
            "name": "Milestone 1", "phase": "discovery",
        }, format="json")
        self.assertIn(resp.status_code, [201, 200])

    def test_approval_gate_crud(self):
        url = reverse("approvalgate-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {
            "name": "Gate 1", "decision_type": "client_facing",
            "approver": self.human.pk,
        }, format="json")
        self.assertIn(resp.status_code, [201, 200])

    def test_risk_crud(self):
        url = reverse("risk-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {
            "title": "Risk 1", "severity": "high",
            "category": "technical", "client_visible": True,
        }, format="json")
        self.assertIn(resp.status_code, [201, 200])

    def test_decision_crud(self):
        url = reverse("decision-list", kwargs={"project_pk": self.project.pk})
        resp = self.client.post(url, {
            "title": "Decision 1", "decision_type": "technical",
            "decision_maker": self.human.pk, "outcome": "proposed",
        }, format="json")
        self.assertIn(resp.status_code, [201, 200])


class ProjectAccessTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Acme", project_name="Storefront", slug="access-project",
        )
        self.member = User.objects.create_user(username="member", password="correct-horse-9")
        self.outsider = User.objects.create_user(username="outsider", password="correct-horse-9")
        self.staff = User.objects.create_user(
            username="staffer", password="correct-horse-9", is_staff=True,
        )
        self.project.members.add(self.member)
        self.workstream = Workstream.objects.create(
            project=self.project, name="Discovery", slug="discovery",
            human_owner=TeamMember.objects.create(
                project=self.project, name="Alice", role="project_lead", kind="human",
            ),
        )

    def test_anonymous_cannot_list_projects(self):
        self.assertIn(self.client.get("/api/projects/").status_code, (401, 403))

    def test_member_sees_own_project_only(self):
        self.client.force_login(self.member)
        resp = self.client.get("/api/projects/")
        self.assertEqual(resp.status_code, 200)
        slugs = [row["slug"] for row in resp.data["results"]]
        self.assertEqual(slugs, ["access-project"])

    def test_outsider_gets_404_on_foreign_project(self):
        self.client.force_login(self.outsider)
        self.assertEqual(self.client.get("/api/projects/").data["results"], [])
        self.assertEqual(
            self.client.get(f"/api/projects/{self.project.pk}/").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"/api/projects/{self.project.pk}/dashboard/").status_code, 404
        )
        self.assertEqual(
            self.client.get(f"/api/projects/{self.project.pk}/workstreams/").data["results"], []
        )
        self.assertEqual(
            self.client.get(f"/api/projects/{self.project.pk}/workstreams/{self.workstream.pk}/").status_code,
            404,
        )
        self.assertEqual(
            self.client.get(f"/api/workstreams/{self.workstream.pk}/tasks/").data["results"], []
        )

    def test_creator_is_added_as_member(self):
        self.client.force_login(self.staff)
        resp = self.client.post("/api/projects/", {
            "client_name": "New Co", "project_name": "New Store", "slug": "new-store",
        }, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        project = Project.objects.get(slug="new-store")
        self.assertIn(self.staff, project.members.all())


class ProjectCreationPermissionTests(TestCase):
    """Projects are opened by staff. Client accounts are read-only participants."""

    def setUp(self):
        self.client = APIClient()
        self.staff = User.objects.create_user(
            username="staffer", password="correct-horse-9", is_staff=True,
        )
        self.client_user = User.objects.create_user(
            username="clientuser", password="correct-horse-9",
        )
        self.payload = {
            "client_name": "Acme", "project_name": "Storefront", "slug": "perm-project",
        }

    def test_non_staff_cannot_create_project(self):
        self.client.force_login(self.client_user)
        resp = self.client.post("/api/projects/", self.payload, format="json")
        self.assertEqual(resp.status_code, 403)
        self.assertFalse(Project.objects.filter(slug="perm-project").exists())

    def test_anonymous_cannot_create_project(self):
        resp = self.client.post("/api/projects/", self.payload, format="json")
        self.assertIn(resp.status_code, (401, 403))
        self.assertFalse(Project.objects.filter(slug="perm-project").exists())

    def test_staff_can_create_project(self):
        self.client.force_login(self.staff)
        resp = self.client.post("/api/projects/", self.payload, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)

    def test_non_staff_cannot_delete_project(self):
        project = Project.objects.create(**self.payload)
        self.client.force_login(self.client_user)
        project.members.add(self.client_user)
        resp = self.client.delete(f"/api/projects/{project.pk}/")
        self.assertEqual(resp.status_code, 403)

    def test_members_is_not_writable(self):
        project = Project.objects.create(**self.payload)
        outsider = User.objects.create_user(username="intruder", password="correct-horse-9")
        self.client.force_login(self.staff)
        resp = self.client.patch(
            f"/api/projects/{project.pk}/", {"members": [outsider.pk]}, format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertNotIn(outsider, project.members.all())

    def test_members_action_requires_staff(self):
        project = Project.objects.create(**self.payload)
        self.client.force_login(self.client_user)
        project.members.add(self.client_user)
        resp = self.client.get(f"/api/projects/{project.pk}/members/")
        self.assertEqual(resp.status_code, 403)

    def test_staff_can_add_and_remove_member(self):
        project = Project.objects.create(**self.payload)
        self.client.force_login(self.staff)
        resp = self.client.post(
            f"/api/projects/{project.pk}/members/",
            {"username": self.client_user.username},
            format="json",
        )
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertIn(self.client_user, project.members.all())

        resp = self.client.delete(
            f"/api/projects/{project.pk}/members/", {"user_id": self.client_user.pk}, format="json",
        )
        self.assertEqual(resp.status_code, 204, resp.data)
        self.assertNotIn(self.client_user, project.members.all())

    def test_members_action_reports_unknown_user(self):
        project = Project.objects.create(**self.payload)
        self.client.force_login(self.staff)
        resp = self.client.post(
            f"/api/projects/{project.pk}/members/", {"username": "ghost"}, format="json",
        )
        self.assertEqual(resp.status_code, 404)

    def test_staff_sees_all_projects(self):
        mine = Project.objects.create(**self.payload)
        theirs = Project.objects.create(
            client_name="Other", project_name="Other", slug="other-project",
        )
        self.client.force_login(self.staff)
        slugs = {row["slug"] for row in self.client.get("/api/projects/").data["results"]}
        self.assertEqual(slugs, {mine.slug, theirs.slug})

    def test_staff_sees_workstreams_of_projects_they_do_not_own(self):
        project = Project.objects.create(**self.payload)
        Workstream.objects.create(
            project=project, name="Discovery", slug="discovery",
            human_owner=TeamMember.objects.create(
                project=project, name="Alice", role="project_lead", kind="human",
            ),
        )
        self.client.force_login(self.staff)
        resp = self.client.get(f"/api/projects/{project.pk}/workstreams/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data["count"], 1)


class DashboardAudienceTests(TestCase):
    """The team audience is the unredacted internal picture, so it is staff-only.
    A client member cannot read it by asking for it."""

    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Acme", project_name="Storefront", slug="audience-project",
            budget=45000,
        )
        self.staff = User.objects.create_user(
            username="staffer", password="correct-horse-9", is_staff=True,
        )
        self.member = User.objects.create_user(username="member", password="correct-horse-9")
        self.project.members.add(self.member)

        self.client_lead = TeamMember.objects.create(
            project=self.project, name="Nina", role="client_lead", kind="human",
            client_access=True,
        )
        self.internal_lead = TeamMember.objects.create(
            project=self.project, name="Tom", role="woocommerce_specialist", kind="human",
            client_access=False,
        )
        self.ai_agent = TeamMember.objects.create(
            project=self.project, name="Agent", role="ai_assistant", kind="ai",
            client_access=False,
        )
        self.workstream = Workstream.objects.create(
            project=self.project, name="Discovery", slug="discovery",
            human_owner=self.internal_lead,
            inputs="Internal sourcing contacts",
            acceptance_criteria="Vendor quotes below 20 percent",
        )
        self.workstream.ai_assistants.add(self.ai_agent)
        Task.objects.create(
            workstream=self.workstream, title="Internal-only: tool bug",
            description="Internal-only: nightly importer drops rows",
            assignee=self.internal_lead, reviewer=self.client_lead,
        )
        Task.objects.create(
            workstream=self.workstream, title="Confirm product photos",
            description="Client picks the final twelve photos",
            assignee=self.internal_lead, reviewer=self.client_lead,
        )
        ApprovalGate.objects.create(
            project=self.project, name="Launch discount", decision_type="financial",
            approver=self.internal_lead, notes="Margin floor is 18 percent",
        )
        Risk.objects.create(
            project=self.project, title="Supplier delay", owner=self.internal_lead,
            client_visible=False,
        )
        DecisionLog.objects.create(
            project=self.project, title="Drop the bundle", decision_maker=self.internal_lead,
            client_visible=False,
        )

    def team_payload(self):
        self.client.force_login(self.staff)
        resp = self.client.get(f"/api/projects/{self.project.pk}/dashboard/?audience=team")
        self.assertEqual(resp.status_code, 200)
        return resp.data

    def client_payload(self, audience="client"):
        self.client.force_login(self.member)
        resp = self.client.get(f"/api/projects/{self.project.pk}/dashboard/?audience={audience}")
        self.assertEqual(resp.status_code, 200)
        return resp.data

    def test_team_audience_is_the_unredacted_picture(self):
        data = self.team_payload()
        self.assertEqual(len(data["team_members"]), 3)
        self.assertIn("inputs", data["workstreams"][0])
        self.assertEqual(len(data["tasks"]), 2)
        self.assertEqual(len(data["risks"]), 1)
        self.assertEqual(len(data["decisions"]), 1)
        self.assertIn("notes", data["approval_gates"][0])

    def test_client_audience_hides_internal_state(self):
        data = self.client_payload()
        self.assertEqual([m["name"] for m in data["team_members"]], ["Nina"])
        self.assertNotIn("inputs", data["workstreams"][0])
        self.assertNotIn("acceptance_criteria", data["workstreams"][0])
        self.assertNotIn("ai_assistants", data["workstreams"][0])
        self.assertEqual([t["title"] for t in data["tasks"]], ["Confirm product photos"])
        self.assertEqual(data["risks"], [])
        self.assertEqual(data["decisions"], [])
        self.assertNotIn("notes", data["approval_gates"][0])

    def test_client_cannot_escalate_to_the_team_audience(self):
        for audience in ("team", "client"):
            with self.subTest(audience=audience):
                data = self.client_payload(audience)
                self.assertEqual([m["name"] for m in data["team_members"]], ["Nina"])
                self.assertEqual(data["risks"], [])
                self.assertEqual(data["decisions"], [])
                self.assertNotIn("inputs", data["workstreams"][0])
                self.assertEqual([t["title"] for t in data["tasks"]], ["Confirm product photos"])

    def test_client_cannot_escape_via_the_omitted_audience(self):
        self.client.force_login(self.member)
        resp = self.client.get(f"/api/projects/{self.project.pk}/dashboard/")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual([m["name"] for m in resp.data["team_members"]], ["Nina"])
        self.assertEqual(resp.data["risks"], [])

    def test_staff_still_gets_both_audiences(self):
        self.assertEqual(len(self.team_payload()["team_members"]), 3)
        self.client.force_login(self.staff)
        resp = self.client.get(f"/api/projects/{self.project.pk}/dashboard/?audience=client")
        self.assertEqual([m["name"] for m in resp.data["team_members"]], ["Nina"])

    def test_unknown_audience_is_rejected(self):
        self.client.force_login(self.member)
        resp = self.client.get(f"/api/projects/{self.project.pk}/dashboard/?audience=internal")
        self.assertEqual(resp.status_code, 400)
