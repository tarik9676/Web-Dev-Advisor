from django.conf import settings
from django.db import models


class UserPreference(models.Model):
    """Per-user interface choices. Unlike localStorage these follow the
    account, so a delivery-control collapse (or any later preference)
    survives every device and browser."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferences",
    )
    delivery_control_collapsed = models.BooleanField(
        default=False,
        help_text="Collapses the Delivery control section of the app sidebar.",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "User preference"
        verbose_name_plural = "User preferences"

    def __str__(self):
        return f"Preferences for {self.user.username}"
