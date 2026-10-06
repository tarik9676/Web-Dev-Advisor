from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from django.shortcuts import get_object_or_404

from .models import Product, ProductCategory, ProductDownload, ProductLicense, Service
from .serializers import (
    ProductCategorySerializer,
    ProductDetailSerializer,
    ProductDownloadSerializer,
    ProductLicenseSerializer,
    ProductListSerializer,
    ServiceAdminSerializer,
    ServiceSerializer,
)


def _is_staff(request):
    user = getattr(request, "user", None)
    return bool(user and getattr(user, "is_staff", False))


class ProductCategoryViewSet(ReadOnlyModelViewSet):
    queryset = ProductCategory.objects.filter(is_active=True)
    serializer_class = ProductCategorySerializer
    permission_classes = [AllowAny]
    ordering = ["order", "name"]


class ProductViewSet(ModelViewSet):
    queryset = Product.objects.select_related("category").all()
    serializer_class = ProductListSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["category", "billing_type", "license_type", "is_featured"]
    search_fields = ["name", "short_description", "description", "tags"]
    ordering_fields = ["price", "created_at", "sort_order"]
    ordering = ["-is_featured", "sort_order", "-created_at"]
    lookup_field = "slug"
    lookup_url_kwarg = "productSlug"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ProductDetailSerializer
        if self.action == "list":
            return ProductListSerializer
        return ProductDetailSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        # Public listing only returns active products; admins see everything.
        if self.request.user.is_authenticated and self.request.user.is_staff:
            return qs
        return qs.filter(status="active")

    def get_object(self):
        queryset = self.filter_queryset(self.get_queryset())
        lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
        filter_kwargs = {self.lookup_field: self.kwargs[lookup_url_kwarg]}
        obj = get_object_or_404(queryset, **filter_kwargs)
        self.check_object_permissions(self.request, obj)
        return obj

    @action(detail=False, methods=["get"])
    def featured(self, request):
        products = self.get_queryset().filter(is_featured=True)[:8]
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def by_category(self, request):
        category_slug = request.query_params.get("category")
        if not category_slug:
            return Response({"error": "category parameter required"}, status=status.HTTP_400_BAD_REQUEST)
        products = self.get_queryset().filter(category__slug=category_slug)
        serializer = self.get_serializer(products, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        obj = serializer.save()
        if obj.status == "active" and not obj.published_at:
            from django.utils import timezone
            obj.published_at = timezone.now()
            obj.save(update_fields=["published_at"])
        return obj

    def perform_update(self, serializer):
        obj = serializer.save()
        if obj.status == "active" and not obj.published_at:
            from django.utils import timezone
            obj.published_at = timezone.now()
            obj.save(update_fields=["published_at"])
        return obj


class ServiceViewSet(ModelViewSet):
    """CRUD for service lines (WooCommerce dev, performance, security, etc.)."""

    queryset = Service.objects.all()
    lookup_field = "slug"
    lookup_url_kwarg = "serviceSlug"

    def get_serializer_class(self):
        if self.action == "list":
            return ServiceSerializer
        return ServiceAdminSerializer

    def get_permissions(self):
        if self.action in ("create", "update", "partial_update", "destroy"):
            return [IsAdminUser()]
        return [AllowAny()]

    def get_queryset(self):
        qs = super().get_queryset()
        if _is_staff(self.request):
            return qs
        return qs.filter(status="active")

    def perform_create(self, serializer):
        obj = serializer.save()
        if obj.status == "active" and not obj.published_at:
            from django.utils import timezone
            obj.published_at = timezone.now()
            obj.save(update_fields=["published_at"])
        return obj

    def perform_update(self, serializer):
        obj = serializer.save()
        if obj.status == "active" and not obj.published_at:
            from django.utils import timezone
            obj.published_at = timezone.now()
            obj.save(update_fields=["published_at"])
        return obj


class ProductLicenseViewSet(ModelViewSet):
    serializer_class = ProductLicenseSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        email = self.request.query_params.get("email")
        if email:
            return ProductLicense.objects.filter(user_email=email).select_related("product", "product__category")
        return ProductLicense.objects.none()

    @action(detail=False, methods=["post"])
    def verify(self, request):
        license_key = request.data.get("license_key")
        if not license_key:
            return Response({"error": "license_key required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            license_obj = ProductLicense.objects.select_related("product").get(license_key=license_key)
            return Response({
                "valid": license_obj.is_valid(),
                "license": ProductLicenseSerializer(license_obj, context={"request": request}).data,
            })
        except ProductLicense.DoesNotExist:
            return Response({"valid": False, "error": "License not found"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["post"])
    def activate_site(self, request, pk=None):
        license_obj = self.get_object()
        site_url = request.data.get("site_url")
        if not site_url:
            return Response({"error": "site_url required"}, status=status.HTTP_400_BAD_REQUEST)
        if not license_obj.can_activate_site(site_url):
            return Response({"error": "Cannot activate site"}, status=status.HTTP_400_BAD_REQUEST)
        if site_url not in license_obj.sites_activated:
            license_obj.sites_activated.append(site_url)
            license_obj.save(update_fields=["sites_activated"])
        return Response({"success": True, "sites_activated": license_obj.sites_activated})


class ProductDownloadViewSet(ModelViewSet):
    serializer_class = ProductDownloadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        license_key = self.request.query_params.get("license_key")
        if license_key:
            return ProductDownload.objects.filter(license__license_key=license_key).select_related("product")
        return ProductDownload.objects.none()

    def perform_create(self, serializer):
        license_key = self.request.data.get("license_key")
        if not license_key:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"license_key": "Required"})
        try:
            license_obj = ProductLicense.objects.get(license_key=license_key)
        except ProductLicense.DoesNotExist:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"license_key": "Invalid license"})
        serializer.save(license=license_obj)


class CheckoutViewSet(ModelViewSet):
    serializer_class = ProductLicenseSerializer
    permission_classes = [AllowAny]
    http_method_names = ["post"]

    def create(self, request):
        import stripe
        from django.conf import settings

        product_id = request.data.get("product_id")
        email = request.data.get("email")
        name = request.data.get("name", "")
        license_type = request.data.get("license_type", "single")

        if not product_id or not email:
            return Response(
                {"error": "product_id and email are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            product = Product.objects.get(id=product_id, status="active")
        except Product.DoesNotExist:
            return Response(
                {"error": "Product not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")

        if not stripe.api_key:
            return Response(
                {"error": "Stripe not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        price_id = product.stripe_price_id
        if not price_id:
            return Response(
                {"error": "Product not configured for purchase"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={"product_id": str(product.id)},
            )

            if product.billing_type in ["monthly", "yearly"]:
                session = stripe.checkout.Session.create(
                    customer=customer.id,
                    payment_method_types=["card"],
                    line_items=[{
                        "price": price_id,
                        "quantity": 1,
                    }],
                    mode="subscription",
                    success_url=request.data.get("success_url", f"{request.build_absolute_uri('/')}/products/{product.slug}?success=true"),
                    cancel_url=request.data.get("cancel_url", f"{request.build_absolute_uri('/')}/products/{product.slug}?canceled=true"),
                    metadata={
                        "product_id": str(product.id),
                        "license_type": license_type,
                    },
                )
            else:
                session = stripe.checkout.Session.create(
                    customer=customer.id,
                    payment_method_types=["card"],
                    line_items=[{
                        "price": price_id,
                        "quantity": 1,
                    }],
                    mode="payment",
                    success_url=request.data.get("success_url", f"{request.build_absolute_uri('/')}/products/{product.slug}?success=true"),
                    cancel_url=request.data.get("cancel_url", f"{request.build_absolute_uri('/')}/products/{product.slug}?canceled=true"),
                    metadata={
                        "product_id": str(product.id),
                        "license_type": license_type,
                    },
                )

            return Response({
                "checkout_url": session.url,
                "session_id": session.id,
            })

        except stripe.error.StripeError as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class WebhookViewSet(ModelViewSet):
    permission_classes = [AllowAny]
    http_method_names = ["post"]

    def create(self, request):
        import stripe
        from django.conf import settings
        from django.utils import timezone
        import json

        stripe.api_key = getattr(settings, "STRIPE_SECRET_KEY", "")
        webhook_secret = getattr(settings, "STRIPE_WEBHOOK_SECRET", "")

        if not stripe.api_key or not webhook_secret:
            return Response(
                {"error": "Stripe not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        try:
            event = stripe.Webhook.construct_event(payload, sig_header, webhook_secret)
        except ValueError:
            return Response({"error": "Invalid payload"}, status=status.HTTP_400_BAD_REQUEST)
        except stripe.error.SignatureVerificationError:
            return Response({"error": "Invalid signature"}, status=status.HTTP_400_BAD_REQUEST)

        # Project invoices ride the same verified webhook. Money state for those
        # flips here too, keyed off Stripe metadata rather than a client action.
        from projects.stripe_billing import handle_invoice_event

        handle_invoice_event(event)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            self.handle_checkout_completed(session)

        elif event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            self.handle_subscription_created(subscription)

        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            self.handle_subscription_updated(subscription)

        elif event["type"] == "customer.subscription.deleted":
            subscription = event["data"]["object"]
            self.handle_subscription_deleted(subscription)

        return Response({"received": True})

    def handle_checkout_completed(self, session):
        from .models import Product, ProductLicense
        import uuid

        if (session.get("metadata") or {}).get("kind") == "project_invoice":
            return

        product_id = session.get("metadata", {}).get("product_id")
        license_type = session.get("metadata", {}).get("license_type", "single")
        customer_email = session.get("customer_details", {}).get("email")
        customer_name = session.get("customer_details", {}).get("name", "")

        if not product_id or not customer_email:
            return

        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return

        license_key = f"WDA-{uuid.uuid4().hex[:12].upper()}"

        max_sites = {
            "single": 1,
            "multi": 5,
            "unlimited": 0,
            "developer": 0,
        }.get(license_type, 1)

        expires_at = None
        if product.billing_type in ["monthly", "yearly"]:
            expires_at = timezone.now() + timezone.timedelta(days=30)
        elif product.billing_type == "one_time":
            expires_at = timezone.now() + timezone.timedelta(days=product.download_expiry_days)

        ProductLicense.objects.create(
            product=product,
            user_email=customer_email,
            user_name=customer_name,
            license_key=license_key,
            license_type=license_type,
            status="active",
            max_sites=max_sites,
            expires_at=expires_at,
            stripe_customer_id=session.get("customer"),
            stripe_subscription_id=session.get("subscription"),
            order_id=session.get("id"),
        )

    def handle_subscription_created(self, subscription):
        self.update_license_from_subscription(subscription)

    def handle_subscription_updated(self, subscription):
        self.update_license_from_subscription(subscription)

    def handle_subscription_deleted(self, subscription):
        from .models import ProductLicense

        try:
            license_obj = ProductLicense.objects.get(
                stripe_subscription_id=subscription["id"]
            )
            license_obj.status = "expired"
            license_obj.save(update_fields=["status"])
        except ProductLicense.DoesNotExist:
            pass

    def update_license_from_subscription(self, subscription):
        from .models import ProductLicense
        from django.utils import timezone

        try:
            license_obj = ProductLicense.objects.get(
                stripe_subscription_id=subscription["id"]
            )
            status_map = {
                "active": "active",
                "past_due": "active",
                "canceled": "expired",
                "unpaid": "expired",
            }
            license_obj.status = status_map.get(subscription["status"], "pending")

            current_period_end = subscription.get("current_period_end")
            if current_period_end:
                license_obj.expires_at = timezone.datetime.fromtimestamp(
                    current_period_end, tz=timezone.utc
                )
            license_obj.save(update_fields=["status", "expires_at"])
        except ProductLicense.DoesNotExist:
            pass
