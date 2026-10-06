from django.urls import path

from .views import WorkstreamViewSet, TaskViewSet, MilestoneViewSet

urlpatterns = [
    path("projects/<int:project_pk>/workstreams/", WorkstreamViewSet.as_view({
        "get": "list", "post": "create"
    }), name="workstream-list"),
    path("projects/<int:project_pk>/workstreams/<int:pk>/", WorkstreamViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="workstream-detail"),
    path("workstreams/<int:workstream_pk>/tasks/", TaskViewSet.as_view({
        "get": "list", "post": "create"
    }), name="task-list"),
    path("workstreams/<int:workstream_pk>/tasks/<int:pk>/", TaskViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="task-detail"),
    path("projects/<int:project_pk>/milestones/", MilestoneViewSet.as_view({
        "get": "list", "post": "create"
    }), name="milestone-list"),
    path("projects/<int:project_pk>/milestones/<int:pk>/", MilestoneViewSet.as_view({
        "get": "retrieve", "put": "update", "patch": "partial_update", "delete": "destroy"
    }), name="milestone-detail"),
]
