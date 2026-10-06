from django.contrib import admin

from .models import Project, ProjectInvoice, TeamMember


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["client_name", "project_name", "slug", "status", "launch_date", "created_at"]
    search_fields = ["client_name", "project_name", "slug"]
    list_filter = ["status", "created_at"]
    raw_id_fields = []
    date_hierarchy = "created_at"


@admin.register(ProjectInvoice)
class ProjectInvoiceAdmin(admin.ModelAdmin):
    list_display = ["label", "project", "amount", "currency", "status", "due_date", "paid_at"]
    search_fields = ["label", "description", "project__client_name", "project__project_name"]
    list_filter = ["status", "currency", "due_date"]
    raw_id_fields = ["project", "milestone"]
    readonly_fields = [
        "stripe_checkout_session_id", "stripe_payment_intent_id",
        "paid_at", "created_at", "updated_at",
    ]
    date_hierarchy = "due_date"


@admin.register(TeamMember)
class TeamMemberAdmin(admin.ModelAdmin):
    list_display = ["name", "role", "kind", "client_access", "is_active", "project"]
    search_fields = ["name", "email"]
    list_filter = ["kind", "role", "client_access", "is_active"]
    raw_id_fields = ["project"]