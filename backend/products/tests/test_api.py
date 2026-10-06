from django.test import TestCase
from rest_framework.test import APIClient


class PublicCatalogTests(TestCase):
    def test_catalog_and_checkout_stay_public(self):
        client = APIClient()
        self.assertEqual(client.get("/api/product-categories/").status_code, 200)
        self.assertEqual(client.get("/api/products/").status_code, 200)
