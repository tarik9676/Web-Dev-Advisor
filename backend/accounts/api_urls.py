from django.urls import path

from .views import LoginView, LogoutView, MeView, RegisterView, UIPreferencesView, UserSearchView

urlpatterns = [
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/logout/", LogoutView.as_view(), name="auth-logout"),
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("preferences/", UIPreferencesView.as_view(), name="ui-preferences"),
    path("users/search/", UserSearchView.as_view(), name="user-search"),
]
