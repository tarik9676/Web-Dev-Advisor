from django.db import models
from django.utils import timezone


class Service(models.Model):
    """A service line (e.g. WooCommerce Development, Performance Optimization)."""

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    short_description = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=50, blank=True, default="")
    features = models.JSONField(default=list, blank=True)
    deliverables = models.JSONField(default=list, blank=True)
    timeline = models.CharField(max_length=100, blank=True, default="")
    starting_price = models.CharField(max_length=100, blank=True, default="")
    note = models.TextField(blank=True, default="")
    tiers = models.JSONField(default=list, blank=True)
    faqs = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    blocks = models.JSONField(default=list, blank=True, help_text="Page layout blocks for the service detail page.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_featured", "sort_order", "-created_at"]
        verbose_name = "Service"
        verbose_name_plural = "Services"

    def __str__(self):
        return self.name

    @property
    def is_active(self):
        return self.status == "active"


class ProductCategory(models.Model):
    TYPE_CHOICES = [
        ("plugin", "WordPress Plugin"),
        ("subscription", "App Subscription"),
        ("theme", "Theme"),
        ("bundle", "Bundle"),
        ("service", "Service"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="plugin")
    description = models.TextField(blank=True, default="")
    icon = models.CharField(max_length=50, blank=True, default="")
    order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Product Category"
        verbose_name_plural = "Product Categories"

    def __str__(self):
        return self.name


class Product(models.Model):
    LICENSE_CHOICES = [
        ("single", "Single Site"),
        ("multi", "Multi-Site (5)"),
        ("unlimited", "Unlimited Sites"),
        ("developer", "Developer License"),
    ]

    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("active", "Active"),
        ("archived", "Archived"),
    ]

    BILLING_CHOICES = [
        ("one_time", "One-time Purchase"),
        ("monthly", "Monthly Subscription"),
        ("yearly", "Yearly Subscription"),
        ("lifetime", "Lifetime Access"),
    ]

    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="products",
    )
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    short_description = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    version = models.CharField(max_length=50, blank=True, default="1.0.0")
    license_type = models.CharField(max_length=20, choices=LICENSE_CHOICES, default="single")
    billing_type = models.CharField(max_length=20, choices=BILLING_CHOICES, default="one_time")
    price = models.DecimalField(max_digits=10, decimal_places=2)
    sale_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    sale_ends_at = models.DateTimeField(null=True, blank=True)
    currency = models.CharField(max_length=3, default="USD")
    features = models.JSONField(default=list, blank=True)
    requirements = models.TextField(blank=True, default="")
    changelog = models.TextField(blank=True, default="")
    documentation_url = models.URLField(blank=True, default="")
    demo_url = models.URLField(blank=True, default="")
    thumbnail = models.URLField(blank=True, default="")
    gallery = models.JSONField(default=list, blank=True)
    tags = models.JSONField(default=list, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="draft")
    is_featured = models.BooleanField(default=False)
    download_limit = models.PositiveIntegerField(default=0)
    download_expiry_days = models.PositiveIntegerField(default=365)
    stripe_price_id = models.CharField(max_length=255, blank=True, default="")
    stripe_product_id = models.CharField(max_length=255, blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)
    blocks = models.JSONField(default=list, blank=True, help_text="Page layout blocks for the product detail page.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-is_featured", "sort_order", "-created_at"]
        verbose_name = "Product"
        verbose_name_plural = "Products"

    def __str__(self):
        return self.name

    @property
    def current_price(self):
        if self.sale_price and self.sale_ends_at and self.sale_ends_at > timezone.now():
            return self.sale_price
        return self.price

    @property
    def is_on_sale(self):
        return bool(self.sale_price and self.sale_ends_at and self.sale_ends_at > timezone.now())


class ProductLicense(models.Model):
    STATUS_CHOICES = [
        ("active", "Active"),
        ("expired", "Expired"),
        ("revoked", "Revoked"),
        ("pending", "Pending Payment"),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="licenses")
    user_email = models.EmailField()
    user_name = models.CharField(max_length=255, blank=True, default="")
    license_key = models.CharField(max_length=100, unique=True)
    license_type = models.CharField(max_length=20, choices=Product.LICENSE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    sites_activated = models.JSONField(default=list, blank=True)
    max_sites = models.PositiveIntegerField(default=1)
    purchase_date = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    last_verified = models.DateTimeField(null=True, blank=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, default="")
    stripe_subscription_id = models.CharField(max_length=255, blank=True, default="")
    order_id = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Product License"
        verbose_name_plural = "Product Licenses"

    def __str__(self):
        return f"{self.product.name} - {self.user_email} ({self.license_key[:8]}...)"

    def is_valid(self):
        if self.status != "active":
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    def can_activate_site(self, site_url):
        if not self.is_valid():
            return False
        if self.max_sites == 0:
            return True
        return len(self.sites_activated) < self.max_sites


class ProductDownload(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="downloads")
    license = models.ForeignKey(ProductLicense, on_delete=models.CASCADE, related_name="downloads")
    version = models.CharField(max_length=50)
    file_url = models.URLField()
    file_size = models.PositiveBigIntegerField(default=0)
    checksum = models.CharField(max_length=64, blank=True, default="")
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    class Meta:
        ordering = ["-downloaded_at"]
        verbose_name = "Product Download"
        verbose_name_plural = "Product Downloads"

    def __str__(self):
        return f"{self.product.name} v{self.version} - {self.license.user_email}"