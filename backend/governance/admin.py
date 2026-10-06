from django.contrib import admin

from .models import ApprovalGate, Risk, DecisionLog


@admin.register(ApprovalGate)
class ApprovalGateAdmin(admin.ModelAdmin):
    list_display = ["name", "project", "decision_type", "approver", "status"]
    search_fields = ["name"]
    list_filter = ["project", "decision_type", "status"]
    raw_id_fields = ["project", "approver"]


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "severity", "category", "client_visible", "status"]
    search_fields = ["title"]
    list_filter = ["project", "severity", "category", "client_visible", "status"]
    raw_id_fields = ["project", "owner"]


@admin.register(DecisionLog)
class DecisionLogAdmin(admin.ModelAdmin):
    list_display = ["title", "project", "decision_type", "decision_maker", "outcome"]
    search_fields = ["title"]
    list_filter = ["project", "decision_type", "outcome"]
    raw_id_fields = ["project", "decision_maker"]
