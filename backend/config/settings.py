import os
from pathlib import Path
from urllib.parse import urlparse

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production-dev-only-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", os.environ.get("ALLOWED_HOSTS", "*")).split(",")

DATABASES = {}
_db_url = os.environ.get("DATABASE_URL")
if _db_url:
    parsed = urlparse(_db_url)
    engine_map = {
        "postgres": "django.db.backends.postgresql",
        "postgresql": "django.db.backends.postgresql",
        "mysql": "django.db.backends.mysql",
    }
    engine = engine_map.get(parsed.scheme, "django.db.backends.sqlite3")
    if engine == "django.db.backends.sqlite3":
        name = parsed.path
        if name.startswith("//"):
            name = "/" + name.lstrip("/")
        else:
            name = str(BASE_DIR / name.lstrip("/"))
        DATABASES["default"] = {
            "ENGINE": engine,
            "NAME": name or str(BASE_DIR / "db.sqlite3"),
        }
    else:
        DATABASES["default"] = {
            "ENGINE": engine,
            "NAME": parsed.path.lstrip("/") or "postgres",
            "USER": parsed.username or "",
            "PASSWORD": parsed.password or "",
            "HOST": parsed.hostname or "localhost",
            "PORT": parsed.port or "5432",
            "OPTIONS": {},
        }
else:
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "corsheaders",
    "accounts",
    "products",
    "projects",
    "workstreams",
    "governance",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS",
    os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"),
).split(",")
CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS", os.environ.get("DJANGO_CSRF_TRUSTED_ORIGINS", "")
).split(",")
CSRF_TRUSTED_ORIGINS = [origin for origin in CSRF_TRUSTED_ORIGINS if origin]
if not CSRF_TRUSTED_ORIGINS:
    CSRF_TRUSTED_ORIGINS = [origin for origin in CORS_ALLOWED_ORIGINS if origin]
CORS_ALLOW_CREDENTIALS = os.environ.get("CORS_ALLOW_CREDENTIALS", "true").lower() == "true"

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
# Public origin used to build Stripe Checkout success/cancel URLs when the
# request has no usable Host header (for example behind the compose proxy).
PUBLIC_APP_URL = os.environ.get("PUBLIC_APP_URL", "")

STATIC_URL = "/static/"
STATIC_ROOT = os.environ.get("STATIC_ROOT", BASE_DIR / "staticfiles")
MEDIA_URL = os.environ.get("MEDIA_URL", "/media/")
MEDIA_ROOT = os.environ.get("MEDIA_ROOT", BASE_DIR / "media")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.AllowAny",
    ],
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_FILTER_BACKENDS": [
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.OrderingFilter",
        "rest_framework.filters.SearchFilter",
    ],
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 50,
    "EXCEPTION_HANDLER": "accounts.views.custom_exception_handler",
}

if not DEBUG:
    SECURE_SSL_REDIRECT = os.environ.get("SECURE_SSL_REDIRECT", "true").lower() == "true"
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {"class": "logging.StreamHandler"},
    },
    "root": {"handlers": ["console"], "level": "WARNING"},
    "loggers": {
        "django": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "accounts": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "products": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "projects": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "workstreams": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
        "governance": {"handlers": ["console"], "level": "DEBUG", "propagate": False},
    },
}
