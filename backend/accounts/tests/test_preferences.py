from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient


User = get_user_model()


class UIPreferencesTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="pref-user", password="correct-horse-9",
        )

    def test_anonymous_cannot_read_preferences(self):
        self.assertIn(self.client.get("/api/preferences/").status_code, (401, 403))

    def test_defaults_to_expanded(self):
        self.client.force_login(self.user)
        resp = self.client.get("/api/preferences/")
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["delivery_control_collapsed"], False)

    def test_preference_persists_per_user(self):
        self.client.force_login(self.user)
        resp = self.client.patch(
            "/api/preferences/",
            {"delivery_control_collapsed": True},
            format="json",
        )
        self.assertEqual(resp.status_code, 200, resp.data)
        self.assertEqual(resp.data["delivery_control_collapsed"], True)
        # A fresh GET must still see the stored choice, and it is
        # stored on the user, not in the session.
        self.assertEqual(
            self.client.get("/api/preferences/").data["delivery_control_collapsed"],
            True,
        )
        self.user.refresh_from_db()
        self.assertTrue(self.user.preferences.delivery_control_collapsed)

    def test_preferences_are_isolated_per_user(self):
        other = User.objects.create_user(
            username="pref-other", password="correct-horse-9",
        )
        self.client.force_login(self.user)
        self.client.patch(
            "/api/preferences/",
            {"delivery_control_collapsed": True},
            format="json",
        )
        self.client.force_login(other)
        self.assertEqual(
            self.client.get("/api/preferences/").data["delivery_control_collapsed"],
            False,
        )

    def test_unknown_fields_are_rejected(self):
        self.client.force_login(self.user)
        resp = self.client.patch(
            "/api/preferences/",
            {"delivery_control_collapsed": "maybe"},
            format="json",
        )
        self.assertEqual(resp.status_code, 400, resp.data)
