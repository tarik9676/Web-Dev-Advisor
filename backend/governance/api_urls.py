from django.urls import path

from .views import ApprovalGateViewSet, RiskViewSet, DecisionLogViewSet

urlpatterns = [
    path("projects/<int:project_pk>/approval-gates/", ApprovalGateViewSet.as_view({
        "get": "list", "post": "create"
    }), name="approvalgate-list"),
    path("projects/<int:project_pk>/approval-gates/<int:pk>/", ApprovalGateViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="approvalgate-detail"),
    path("projects/<int:project_pk>/risks/", RiskViewSet.as_view({
        "get": "list", "post": "create"
    }), name="risk-list"),
    path("projects/<int:project_pk>/risks/<int:pk>/", RiskViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="risk-detail"),
    path("projects/<int:project_pk>/decisions/", DecisionLogViewSet.as_view({
        "get": "list", "post": "create"
    }), name="decision-list"),
    path("projects/<int:project_pk>/decisions/<int:pk>/", DecisionLogViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="decision-detail"),
]
