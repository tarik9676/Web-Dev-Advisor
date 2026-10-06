from django.core.management.base import BaseCommand
from django.utils import timezone
from products.models import Service


SERVICES_DATA = [
    {
        "name": "WooCommerce Development",
        "slug": "woocommerce",
        "short_description": "End-to-end store development from strategy to launch.",
        "description": "We deliver complete WooCommerce stores — from architecture and design through build, QA, and launch. Every project is run by a dedicated human-led pod with AI acceleration for repetitive tasks.",
        "icon": "Globe",
        "features": [
            "Custom theme development (classic & block themes)",
            "Headless WooCommerce (Next.js, React, Vue frontends)",
            "Multisite & multi-currency configurations",
            "Migration from Shopify, Magento, BigCommerce",
            "Custom checkout & cart experiences",
            "Product configurators & bundles",
        ],
        "deliverables": [
            "Production-ready theme/plugin code",
            "CI/CD pipeline with automated testing",
            "Performance budget & Core Web Vitals report",
            "Security audit & hardening checklist",
            "Client training & documentation",
        ],
        "timeline": "6–12 weeks",
        "starting_price": "$15,000",
        "tiers": [],
        "faqs": [],
        "note": "",
        "is_featured": True,
        "sort_order": 0,
        "status": "active",
    },
    {
        "name": "Custom Plugin Development",
        "slug": "plugins",
        "short_description": "Bespoke plugins for unique business requirements.",
        "description": "We build custom WooCommerce and WordPress plugins tailored to your exact workflow. Every plugin follows WordPress coding standards, ships with automated tests, and includes 6 months of maintenance.",
        "icon": "Code",
        "features": [
            "Custom payment gateway integrations",
            "Shipping & fulfillment calculators",
            "Subscription & membership systems",
            "Custom product types & configurators",
            "Third-party API integrations (ERP, CRM, PIM)",
            "Admin UX improvements & custom blocks",
        ],
        "deliverables": [
            "Production-ready plugin (PSR-12, WP Coding Standards)",
            "Automated test suite (unit + integration)",
            "Admin documentation & developer guide",
            "Composer/Composer-ready distribution",
            "6 months maintenance included",
        ],
        "timeline": "4–8 weeks",
        "starting_price": "$8,000",
        "tiers": [],
        "faqs": [],
        "note": "",
        "is_featured": True,
        "sort_order": 1,
        "status": "active",
    },
    {
        "name": "Performance Optimization",
        "slug": "performance",
        "short_description": "Core Web Vitals optimization for conversion-critical stores.",
        "description": "We optimize WooCommerce stores for speed and Core Web Vitals. Measurable improvements backed by before/after reports and 30-day monitoring.",
        "icon": "Zap",
        "features": [
            "Core Web Vitals audit & remediation",
            "Database query optimization & indexing",
            "Caching strategy (Redis, Varnish, CDN)",
            "Image optimization & next-gen formats",
            "Third-party script audit & deferral",
            "Load testing & capacity planning",
        ],
        "deliverables": [
            "Before/after Core Web Vitals report",
            "Optimized caching configuration",
            "Database optimization scripts",
            "Monitoring dashboard (Grafana/Prometheus)",
            "30-day performance monitoring",
        ],
        "timeline": "3–6 weeks",
        "starting_price": "$12,000",
        "tiers": [],
        "faqs": [],
        "note": "",
        "is_featured": True,
        "sort_order": 2,
        "status": "active",
    },
    {
        "name": "Security & Compliance",
        "slug": "security",
        "short_description": "Enterprise-grade security for transactional stores.",
        "description": "PCI DSS readiness, GDPR/CCPA compliance, OWASP remediation, and ongoing security monitoring for stores that handle sensitive data.",
        "icon": "Lock",
        "features": [
            "PCI DSS SAQ-A/SAQ-D readiness",
            "GDPR/CCPA data handling compliance",
            "OWASP Top 10 remediation",
            "Automated vulnerability scanning (CI/CD)",
            "WAF configuration & rule tuning",
            "Secure coding training for your team",
            "Incident response plan & runbooks",
        ],
        "deliverables": [
            "Security audit report with risk ratings",
            "Remediation plan with timelines",
            "PCI DSS evidence package",
            "GDPR data flow documentation",
            "WAF ruleset & monitoring alerts",
            "Incident response runbook",
        ],
        "timeline": "4–8 weeks",
        "starting_price": "$15,000",
        "tiers": [],
        "faqs": [],
        "note": "",
        "is_featured": True,
        "sort_order": 3,
        "status": "active",
    },
    {
        "name": "Maintenance & Support",
        "slug": "maintenance",
        "short_description": "Ongoing reliability for mission-critical stores.",
        "description": "Three tiers of ongoing maintenance and support — from essential updates to 24/7 incident response with dedicated Slack.",
        "icon": "Shield",
        "features": [],
        "deliverables": [],
        "timeline": "Ongoing",
        "starting_price": "$500/mo",
        "tiers": [
            {
                "name": "Essential",
                "price": "$500/mo",
                "features": [
                    "Weekly core/plugin/theme updates",
                    "Daily automated backups (30-day retention)",
                    "Uptime monitoring (5-min intervals)",
                    "Security patching within 24h",
                    "Email support (business hours)",
                ],
            },
            {
                "name": "Professional",
                "price": "$1,500/mo",
                "popular": True,
                "features": [
                    "Everything in Essential",
                    "Performance monitoring & alerts",
                    "Monthly performance report",
                    "Staging environment management",
                    "Priority email support (4h SLA)",
                    "Quarterly performance review",
                ],
            },
            {
                "name": "Enterprise",
                "price": "$3,500/mo",
                "features": [
                    "Everything in Professional",
                    "24/7 monitoring & incident response",
                    "1-hour critical incident SLA",
                    "Dedicated Slack channel",
                    "Monthly architecture review",
                    "Disaster recovery testing (quarterly)",
                    "Custom SLA & compliance reporting",
                ],
            },
        ],
        "faqs": [],
        "note": "",
        "is_featured": True,
        "sort_order": 4,
        "status": "active",
    },
    {
        "name": "AI-Accelerated Delivery",
        "slug": "ai",
        "short_description": "AI agents under human supervision for faster delivery.",
        "description": "Our AI agents handle repetitive, well-defined tasks: generating boilerplate code, writing tests, creating documentation, analyzing requirements. Every AI output is reviewed and approved by a named human engineer before it enters the codebase.",
        "icon": "Cpu",
        "features": [
            "Requirements analysis & user story generation",
            "Code generation (PHP, JS, CSS, SQL)",
            "Automated test generation (PHPUnit, Cypress)",
            "Documentation generation (README, PHPDoc, OpenAPI)",
            "Code review assistance & security scanning",
            "Migration script generation",
        ],
        "deliverables": [],
        "timeline": "Included in all projects",
        "starting_price": "Included",
        "tiers": [],
        "faqs": [
            {
                "question": "How does human-AI collaboration work in practice?",
                "answer": "Our AI agents handle repetitive, well-defined tasks: generating boilerplate code, writing tests, creating documentation, analyzing requirements. Every AI output is reviewed and approved by a named human engineer before it enters the codebase. The human remains the decision-maker and owner of the outcome."
            },
            {
                "question": "What makes your WooCommerce expertise different?",
                "answer": "We've delivered 200+ WooCommerce projects ranging from simple stores to complex multi-vendor marketplaces. Our team includes WooCommerce core contributors, plugin authors, and performance specialists. We don't just build stores—we build scalable, maintainable platforms."
            },
            {
                "question": "How do you handle project management and communication?",
                "answer": "Every project gets a dedicated pod: Project Lead, Designer, Senior Developer, QA Lead, WooCommerce Specialist, and AI agents. You get a dedicated Project Lead as your single point of contact, weekly syncs, real-time dashboard access, and shared Notion workspace."
            },
            {
                "question": "What's your typical project timeline?",
                "answer": "Depends on scope: Simple store (6-8 weeks), Custom theme + plugins (10-14 weeks), Complex marketplace/migration (16-24 weeks). We provide detailed milestone plans with clear acceptance criteria for each phase."
            },
            {
                "question": "Do you offer fixed-price or time & materials?",
                "answer": "Both. Fixed-price for well-scoped projects (custom plugins, migrations, audits). Time & materials for ongoing development, retainers, and exploratory work. We're transparent about which model fits your situation."
            },
            {
                "question": "What's included in maintenance plans?",
                "answer": "All tiers include automated backups, security patching, uptime monitoring, and core updates. Professional adds performance monitoring, staging management, and quarterly reviews. Enterprise adds 24/7 incident response, dedicated Slack, and compliance reporting."
            },
            {
                "question": "Do you work with agencies as a white-label partner?",
                "answer": "Yes. We white-label for agencies needing WooCommerce capacity. Your clients see your brand; we deliver the technical execution with full transparency and your project management tools."
            },
        ],
        "note": "Included at no extra cost on all projects.",
        "is_featured": True,
        "sort_order": 5,
        "status": "active",
    },
]


class Command(BaseCommand):
    help = "Seed the database with the standard service categories"

    def handle(self, *args, **options):
        for sdata in SERVICES_DATA:
            Service.objects.update_or_create(
                slug=sdata["slug"], defaults=sdata
            )
        self.stdout.write(self.style.SUCCESS("Successfully seeded services"))
