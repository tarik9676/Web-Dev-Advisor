from django.db import models


class ApprovalGate(models.Model):
    DECISION_TYPE_CHOICES = [
        ("client_facing", "Client Facing"),
        ("financial", "Financial"),
        ("security", "Security"),
        ("production", "Production"),
        ("scope", "Scope"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("escalated", "Escalated"),
    ]

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="approval_gates")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    decision_type = models.CharField(max_length=20, choices=DECISION_TYPE_CHOICES)
    approver = models.ForeignKey(
        "projects.TeamMember",
        on_delete=models.PROTECT,
        related_name="gating_approvals",
        limit_choices_to={"kind": "human"},
    )
    required = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Approval Gate"
        verbose_name_plural = "Approval Gates"

    def __str__(self):
        return f"{self.name} ({self.get_decision_type_display()})"


class Risk(models.Model):
    SEVERITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("identified", "Identified"),
        ("mitigating", "Mitigating"),
        ("resolved", "Resolved"),
        ("accepted", "Accepted"),
    ]

    CATEGORY_CHOICES = [
        ("technical", "Technical"),
        ("resource", "Resource"),
        ("schedule", "Schedule"),
        ("budget", "Budget"),
        ("client", "Client"),
        ("security", "Security"),
        ("compliance", "Compliance"),
        ("other", "Other"),
    ]

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="risks")
    owner = models.ForeignKey(
        "projects.TeamMember",
        on_delete=models.PROTECT,
        related_name="owned_risks",
        limit_choices_to={"kind": "human"},
        null=True,
        blank=True,
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    severity = models.CharField(max_length=10, choices=SEVERITY_CHOICES, default="medium")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default="other")
    mitigation = models.TextField(blank=True, default="")
    client_visible = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="identified")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-severity", "-created_at"]
        verbose_name = "Risk"
        verbose_name_plural = "Risks"

    def __str__(self):
        return f"{self.title} ({self.get_severity_display()})"


class DecisionLog(models.Model):
    DECISION_TYPE_CHOICES = [
        ("client_facing", "Client Facing"),
        ("financial", "Financial"),
        ("security", "Security"),
        ("production", "Production"),
        ("scope", "Scope"),
        ("technical", "Technical"),
        ("process", "Process"),
    ]

    STATUS_CHOICES = [
        ("proposed", "Proposed"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
        ("superseded", "Superseded"),
    ]

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="decisions")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    decision_type = models.CharField(max_length=20, choices=DECISION_TYPE_CHOICES, default="technical")
    decision_maker = models.ForeignKey("projects.TeamMember", on_delete=models.PROTECT, related_name="made_decisions")
    client_visible = models.BooleanField(default=True)
    outcome = models.CharField(max_length=20, choices=STATUS_CHOICES, default="proposed")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Decision"
        verbose_name_plural = "Decisions"

    def __str__(self):
        return f"{self.title} ({self.get_outcome_display()})"
