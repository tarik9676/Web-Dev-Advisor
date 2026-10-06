from rest_framework import serializers

from .models import Product, ProductCategory, ProductDownload, ProductLicense, Service


class ProductCategorySerializer(serializers.ModelSerializer):
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = ProductCategory
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]

    def get_product_count(self, obj):
        return obj.products.filter(status="active").count()


class ProductListSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = [
            "id", "name", "slug", "short_description", "category",
            "license_type", "billing_type", "price", "sale_price",
            "sale_ends_at", "currency", "thumbnail", "tags",
            "is_featured", "current_price", "is_on_sale",
            "created_at", "updated_at", "published_at",
        ]
        read_only_fields = ["created_at", "updated_at", "published_at"]


class ProductDetailSerializer(serializers.ModelSerializer):
    category = ProductCategorySerializer(read_only=True)
    category_slug = serializers.SlugRelatedField(
        source="category",
        slug_field="slug",
        queryset=ProductCategory.objects.all(),
        required=False,
        allow_null=True,
        write_only=True,
    )
    current_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    related_products = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = [
            "created_at", "updated_at", "published_at", "current_price", "is_on_sale", "related_products"
        ]

    def get_related_products(self, obj):
        related = Product.objects.filter(
            status="active", category=obj.category
        ).exclude(id=obj.id)[:4]
        return ProductListSerializer(related, many=True, context=self.context).data


class ProductLicenseSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)

    class Meta:
        model = ProductLicense
        fields = "__all__"
        read_only_fields = [
            "license_key", "purchase_date", "created_at", "updated_at"
        ]


class ProductDownloadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductDownload
        fields = "__all__"
        read_only_fields = ["downloaded_at"]


class ServiceSerializer(serializers.ModelSerializer):
    """Public-facing serializer for services. Omits internal fields."""

    class Meta:
        model = Service
        fields = [
            "id", "name", "slug", "short_description", "description", "icon",
            "features", "deliverables", "timeline", "starting_price",
            "note", "tiers", "faqs", "is_featured",
        ]
        read_only_fields = ["id"]


class ServiceAdminSerializer(serializers.ModelSerializer):
    """Full serializer used by the admin/content tooling."""

    class Meta:
        model = Service
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "published_at"]