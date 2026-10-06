from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("accounts.api_urls")),
    path("api/", include("products.api_urls")),
    path("api/", include("projects.api_urls")),
    path("api/", include("workstreams.api_urls")),
    path("api/", include("governance.api_urls")),
]
