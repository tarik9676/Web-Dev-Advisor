from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    ProductCategoryViewSet,
    ProductViewSet,
    ProductLicenseViewSet,
    ProductDownloadViewSet,
    CheckoutViewSet,
    ServiceViewSet,
    WebhookViewSet,
)

router = DefaultRouter(trailing_slash=True)
router.register(r"product-categories", ProductCategoryViewSet, basename="product-category")
router.register(r"products", ProductViewSet, basename="product")
router.register(r"licenses", ProductLicenseViewSet, basename="license")
router.register(r"downloads", ProductDownloadViewSet, basename="download")
router.register(r"services", ServiceViewSet, basename="service")

urlpatterns = [
    path("", include(router.urls)),
    path("checkout/", CheckoutViewSet.as_view({"post": "create"}), name="checkout"),
    path("webhooks/stripe/", WebhookViewSet.as_view({"post": "create"}), name="stripe-webhook"),
]
