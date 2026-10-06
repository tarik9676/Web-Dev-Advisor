from django.db import models


class Workstream(models.Model):
    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("blocked", "Blocked"),
        ("in_progress", "In Progress"),
        ("internal_review", "Internal Review"),
        ("client_review", "Client Review"),
        ("approved", "Approved"),
        ("done", "Done"),
    ]

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="workstreams")
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    description = models.TextField(blank=True, default="")
    inputs = models.TextField(blank=True, default="")
    outputs = models.TextField(blank=True, default="")
    acceptance_criteria = models.TextField(blank=True, default="")
    dependencies = models.JSONField(default=list, blank=True)
    approval_gate = models.TextField(blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    human_owner = models.ForeignKey(
        "projects.TeamMember",
        on_delete=models.PROTECT,
        related_name="owned_workstreams",
        limit_choices_to={"kind": "human"},
    )
    contributors = models.ManyToManyField("projects.TeamMember", related_name="contributed_workstreams", blank=True)
    ai_assistants = models.ManyToManyField(
        "projects.TeamMember",
        related_name="assigned_workstreams",
        blank=True,
        limit_choices_to={"kind": "ai"},
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order"]
        verbose_name = "Workstream"
        verbose_name_plural = "Workstreams"
        constraints = [
            models.UniqueConstraint(
                fields=["project", "slug"],
                name="unique_workstream_per_project",
            ),
        ]

    def __str__(self):
        return f"{self.name} (owner: {self.human_owner.name})"


class Task(models.Model):
    PRIORITY_CHOICES = [
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("critical", "Critical"),
    ]

    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("blocked", "Blocked"),
        ("in_progress", "In Progress"),
        ("internal_review", "Internal Review"),
        ("client_review", "Client Review"),
        ("approved", "Approved"),
        ("done", "Done"),
    ]

    workstream = models.ForeignKey(Workstream, on_delete=models.CASCADE, related_name="tasks")
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default="medium")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    dependencies = models.ManyToManyField("self", blank=True, symmetrical=False, related_name="dependent_tasks")
    assignee = models.ForeignKey(
        "projects.TeamMember",
        on_delete=models.PROTECT,
        related_name="assigned_tasks",
    )
    reviewer = models.ForeignKey(
        "projects.TeamMember",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewing_tasks",
        limit_choices_to={"kind": "human"},
    )
    due_date = models.DateField(null=True, blank=True)
    definition_of_done = models.TextField(blank=True, default="")
    client_input_required = models.BooleanField(default=False)
    client_input_text = models.TextField(blank=True, default="")
    staging_reference = models.URLField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-due_date"]
        verbose_name = "Task"
        verbose_name_plural = "Tasks"

    def __str__(self):
        return f"{self.title} ({self.status})"


class Milestone(models.Model):
    PHASE_CHOICES = [
        ("discovery", "Discovery"),
        ("architecture", "Architecture and Planning"),
        ("design", "Design"),
        ("build", "Build"),
        ("qa", "QA and Hardening"),
        ("launch", "Launch"),
        ("post_launch", "Post-Launch"),
    ]

    STATUS_CHOICES = [
        ("not_started", "Not Started"),
        ("in_progress", "In Progress"),
        ("completed", "Completed"),
        ("skipped", "Skipped"),
    ]

    project = models.ForeignKey("projects.Project", on_delete=models.CASCADE, related_name="milestones")
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    phase = models.CharField(max_length=20, choices=PHASE_CHOICES)
    target_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="not_started")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["phase"]
        verbose_name = "Milestone"
        verbose_name_plural = "Milestones"

    def __str__(self):
        return f"{self.name} ({self.get_phase_display()})"
