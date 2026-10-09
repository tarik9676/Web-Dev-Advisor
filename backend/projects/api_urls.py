from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    BillingAnalyticsView,
    ClientViewSet,
    GlobalInvoiceListView,
    ProjectInvoiceViewSet,
    ProjectViewSet,
    TeamMemberViewSet,
)

router = DefaultRouter(trailing_slash=True)
router.register(r"projects", ProjectViewSet, basename="project")
router.register(r"clients", ClientViewSet, basename="client")

urlpatterns = [
    path("", include(router.urls)),
    path("billing/analytics/", BillingAnalyticsView.as_view(), name="billing-analytics"),
    path("orders/", GlobalInvoiceListView.as_view(), name="global-invoice-list"),
    path("projects/<int:project_pk>/invoices/", ProjectInvoiceViewSet.as_view({
        "get": "list", "post": "create"
    }), name="invoice-list"),
    path("projects/<int:project_pk>/invoices/<int:pk>/", ProjectInvoiceViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="invoice-detail"),
    path("projects/<int:project_pk>/invoices/<int:pk>/send/", ProjectInvoiceViewSet.as_view({
        "post": "send"
    }), name="invoice-send"),
    path("projects/<int:project_pk>/invoices/<int:pk>/void/", ProjectInvoiceViewSet.as_view({
        "post": "void"
    }), name="invoice-void"),
    path("projects/<int:project_pk>/team-members/", TeamMemberViewSet.as_view({
        "get": "list", "post": "create"
    }), name="team-member-list"),
    path("projects/<int:project_pk>/team-members/<int:pk>/", TeamMemberViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="team-member-detail"),
]
