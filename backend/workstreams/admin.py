from django.contrib import admin

from .models import Workstream, Task, Milestone


@admin.register(Workstream)
class WorkstreamAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "human_owner", "order"]
    search_fields = ["name", "slug"]
    list_filter = ["project"]
    raw_id_fields = ["project", "human_owner", "contributors", "ai_assistants"]


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ["title", "workstream", "status", "priority", "assignee", "reviewer", "due_date"]
    search_fields = ["title"]
    list_filter = ["status", "priority", "workstream"]
    raw_id_fields = ["workstream", "assignee", "reviewer"]


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "phase", "status", "target_date"]
    search_fields = ["name"]
    list_filter = ["project", "phase", "status"]
    raw_id_fields = ["project"]
