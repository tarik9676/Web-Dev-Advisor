from django.conf import settings
from django.db import models


class Client(models.Model):
    """Client organization profile. Referenced by projects for consistent naming,
    contact info, and billing context. Each client has a linked user account
    so they can log in as read-only project participants."""
    name = models.CharField(max_length=255, unique=True)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="client_profile",
        null=True,
        blank=True,
    )
    email = models.EmailField(blank=True, default="")
    company = models.CharField(max_length=255, blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    profile_image = models.URLField(blank=True, default="")
    street_address = models.TextField(blank=True, default="")
    city = models.CharField(max_length=255, blank=True, default="")
    postal_code = models.CharField(max_length=20, blank=True, default="")
    country = models.CharField(max_length=255, blank=True, default="")
    billing_address = models.TextField(blank=True, default="")
    credentials = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Client"
        verbose_name_plural = "Clients"

    def __str__(self):
        return self.name


class Project(models.Model):
    STATUS_CHOICES = [
        ("planning", "Planning"),
        ("active", "Active"),
        ("on_hold", "On Hold"),
        ("complete", "Complete"),
        ("archived", "Archived"),
    ]

    client = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        related_name="projects",
        null=True,
        blank=True,
    )
    client_name = models.CharField(max_length=255, blank=True, default="")
    project_name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    brief = models.TextField(blank=True, default="")
    goals = models.TextField(blank=True, default="")
    success_metrics = models.JSONField(default=list, blank=True)
    target_audience = models.TextField(blank=True, default="")
    regions = models.JSONField(default=list, blank=True)
    budget = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    deadline = models.DateField(null=True, blank=True)
    launch_date = models.DateField(null=True, blank=True)
    staging_url = models.URLField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="planning")
    members = models.ManyToManyField(
        "auth.User",
        related_name="wda_projects",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Project"
        verbose_name_plural = "Projects"

    def __str__(self):
        return f"{self.client_name} — {self.project_name}"


class ProjectInvoice(models.Model):
    """A billing installment against a project, optionally tied to the milestone
    it unlocks. Staff issue invoices; clients never create or mutate them. Money
    state only ever changes from a verified Stripe webhook."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("sent", "Sent"),
        ("paid", "Paid"),
        ("overdue", "Overdue"),
        ("void", "Void"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="invoices")
    milestone = models.ForeignKey(
        "workstreams.Milestone",
        on_delete=models.SET_NULL,
        related_name="invoices",
        null=True,
        blank=True,
    )
    label = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    client_email = models.EmailField(blank=True, default="")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    due_date = models.DateField(null=True, blank=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, default="")
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Project Invoice"
        verbose_name_plural = "Project Invoices"

    def __str__(self):
        return f"{self.label} — {self.amount} {self.currency} ({self.get_status_display()})"


class TeamMember(models.Model):
    KIND_CHOICES = [
        ("human", "Human"),
        ("ai", "AI"),
    ]

    ROLE_CHOICES = [
        ("project_lead", "Project Lead"),
        ("designer", "Designer"),
        ("developer", "Developer"),
        ("senior_developer", "Senior Developer"),
        ("technical_lead", "Technical Lead"),
        ("qa_tester", "QA Tester"),
        ("qa_lead", "QA Lead"),
        ("woocommerce_specialist", "WooCommerce Specialist"),
        ("seo_specialist", "SEO Specialist"),
        ("copywriter", "Copywriter"),
        ("client_lead", "Client Lead"),
        ("requirements_agent", "Requirements Agent"),
        ("ux_agent", "UX Agent"),
        ("design_assistant", "Design Assistant"),
        ("wordpress_developer_agent", "WordPress Developer Agent"),
        ("plugin_developer_agent", "Plugin Developer Agent"),
        ("woocommerce_setup_agent", "WooCommerce Setup Agent"),
        ("content_agent", "Content Agent"),
        ("seo_agent", "SEO Agent"),
        ("qa_agent", "QA Agent"),
        ("performance_agent", "Performance Agent"),
        ("security_agent", "Security Agent"),
        ("documentation_agent", "Documentation Agent"),
    ]

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="team_members")
    name = models.CharField(max_length=255)
    role = models.CharField(max_length=40, choices=ROLE_CHOICES, blank=True, default="")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES, default="human")
    email = models.EmailField(blank=True, default="")
    phone = models.CharField(max_length=40, blank=True, default="")
    avatar_url = models.URLField(blank=True, default="")
    client_access = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        verbose_name = "Team Member"
        verbose_name_plural = "Team Members"

    def __str__(self):
        return f"{self.name} ({self.get_kind_display()})"
