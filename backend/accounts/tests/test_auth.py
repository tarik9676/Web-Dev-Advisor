from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from projects.models import Project


User = get_user_model()


class AuthAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.project = Project.objects.create(
            client_name="Acme", project_name="Storefront", slug="auth-project",
        )
        self.member = User.objects.create_user(
            username="owner", email="owner@example.com", password="correct-horse-9",
        )
        self.project.members.add(self.member)
        self.outsider = User.objects.create_user(
            username="outsider", email="outsider@example.com", password="correct-horse-9",
        )

    def test_register_creates_user_and_signs_in(self):
        resp = self.client.post(reverse("auth-register"), {
            "username": "newuser",
            "email": "New@Example.com",
            "first_name": "New",
            "last_name": "User",
            "password": "sup3r-secret-value",
            "password_confirm": "sup3r-secret-value",
        }, format="json")
        self.assertEqual(resp.status_code, 201, resp.data)
        self.assertEqual(resp.data["email"], "new@example.com")
        self.assertNotIn("password", resp.data)

        me = self.client.get(reverse("auth-me"))
        self.assertEqual(me.status_code, 200)
        self.assertEqual(me.data["username"], "newuser")

    def test_register_rejects_password_mismatch(self):
        resp = self.client.post(reverse("auth-register"), {
            "username": "mismatch",
            "email": "mismatch@example.com",
            "password": "sup3r-secret-value",
            "password_confirm": "different-value",
        }, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("password_confirm", str(resp.data))

    def test_register_rejects_duplicate_email(self):
        resp = self.client.post(reverse("auth-register"), {
            "username": "dupe",
            "email": "owner@example.com",
            "password": "sup3r-secret-value",
            "password_confirm": "sup3r-secret-value",
        }, format="json")
        self.assertEqual(resp.status_code, 400)
        self.assertIn("email", str(resp.data))

    def test_login_with_username(self):
        resp = self.client.post(reverse("auth-login"), {
            "username": "owner", "password": "correct-horse-9",
        }, format="json")
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 200)

    def test_login_with_email(self):
        resp = self.client.post(reverse("auth-login"), {
            "username": "owner@example.com", "password": "correct-horse-9",
        }, format="json")
        self.assertEqual(resp.status_code, 200)

    def test_login_with_wrong_password_is_unauthorized(self):
        resp = self.client.post(reverse("auth-login"), {
            "username": "owner", "password": "nope",
        }, format="json")
        self.assertEqual(resp.status_code, 401)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 401)

    def test_login_requires_both_fields(self):
        resp = self.client.post(reverse("auth-login"), {"username": "owner"}, format="json")
        self.assertEqual(resp.status_code, 400)

    def test_logout_clears_session(self):
        self.client.force_login(self.member)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 200)
        self.assertEqual(self.client.post(reverse("auth-logout")).status_code, 204)
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 401)

    def test_me_is_401_when_anonymous(self):
        self.assertEqual(self.client.get(reverse("auth-me")).status_code, 401)
