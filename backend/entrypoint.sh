#!/bin/sh
set -e

# Run database migrations
python manage.py migrate --noinput

# Seed the demo project (idempotent)
python manage.py seed_demo_project

# Seed the service catalog (idempotent)
python manage.py seed_services

# Collect static files
python manage.py collectstatic --noinput

# Start gunicorn
exec gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 3 --timeout 120