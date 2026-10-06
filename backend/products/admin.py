from django.contrib import admin
from django.utils import timezone

from .models import Product, ProductCategory, ProductDownload, ProductLicense, Service


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "type", "is_active", "order"]
    list_filter = ["type", "is_active"]
    search_fields = ["name", "description"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["name", "category", "billing_type", "status", "is_featured", "price", "published_at"]
    list_filter = ["status", "billing_type", "license_type", "is_featured", "category"]
    search_fields = ["name", "short_description", "description", "tags"]
    prepopulated_fields = {"slug": ("name",)}
    date_hierarchy = "created_at"
    filter_horizontal = []
    fieldsets = (
        (None, {
            "fields": ("name", "slug", "status", "category"),
        }),
        ("Pricing", {
            "fields": ("billing_type", "license_type", "price", "sale_price", "sale_ends_at", "currency", "stripe_price_id", "stripe_product_id"),
        }),
        ("Content", {
            "fields": ("short_description", "description", "features", "requirements", "changelog", "tags", "blocks"),
        }),
        ("Media", {
            "fields": ("thumbnail", "gallery", "demo_url", "documentation_url"),
        }),
        ("Delivery", {
            "fields": ("version", "download_limit", "download_expiry_days", "sort_order", "is_featured"),
        }),
        ("Metadata", {
            "classes": ("collapse",),
            "fields": ("created_at", "updated_at", "published_at"),
        }),
    )
    readonly_fields = ["created_at", "updated_at", "published_at"]

    def save_model(self, request, obj, form, change):
        if not change and not obj.published_at and obj.status == "active":
            obj.published_at = timezone.now()
        if change and obj.status == "active" and not obj.published_at:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["name", "status", "is_featured", "sort_order", "published_at"]
    list_filter = ["status", "is_featured"]
    search_fields = ["name", "short_description", "description"]
    prepopulated_fields = {"slug": ("name",)}
    date_hierarchy = "created_at"
    fieldsets = (
        (None, {
            "fields": ("name", "slug", "status", "is_featured", "sort_order"),
        }),
        ("Identity", {
            "fields": ("short_description", "description", "icon"),
        }),
        ("Offering", {
            "fields": ("features", "deliverables", "tiers", "note", "blocks"),
        }),
        ("Commercial", {
            "fields": ("timeline", "starting_price"),
        }),
        ("Marketing", {
            "fields": ("faqs",),
        }),
        ("Metadata", {
            "classes": ("collapse",),
            "fields": ("created_at", "updated_at", "published_at"),
        }),
    )
    readonly_fields = ["created_at", "updated_at", "published_at"]

    def save_model(self, request, obj, form, change):
        if obj.status == "active" and not obj.published_at:
            obj.published_at = timezone.now()
        super().save_model(request, obj, form, change)


@admin.register(ProductLicense)
class ProductLicenseAdmin(admin.ModelAdmin):
    list_display = ["product", "user_email", "license_type", "status", "expires_at"]
    list_filter = ["status", "license_type"]
    search_fields = ["user_email", "license_key", "product__name"]
    raw_id_fields = ["product"]


@admin.register(ProductDownload)
class ProductDownloadAdmin(admin.ModelAdmin):
    list_display = ["product", "license", "version", "file_size", "downloaded_at"]
    list_filter = ["version"]
    raw_id_fields = ["product", "license"]
    readonly_fields = ["downloaded_at", "ip_address"]