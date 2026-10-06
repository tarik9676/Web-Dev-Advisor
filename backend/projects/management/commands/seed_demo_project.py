from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from projects.models import Project, ProjectInvoice, TeamMember
from workstreams.models import Workstream, Task, Milestone
from governance.models import ApprovalGate, Risk, DecisionLog
from products.models import Product, ProductCategory, ProductLicense, ProductDownload


SLUG = "demo-woocommerce-agency"
DEMO_USERNAME = "demo"
DEMO_EMAIL = "demo@webdevadvisor.local"
DEMO_PASSWORD = "demo-pass-2026"


class Command(BaseCommand):
    help = "Create a synthetic WooCommerce agency demo project"

    def handle(self, *args, **options):
        project, created = Project.objects.get_or_create(
            slug=SLUG,
            defaults={
                "client_name": "Demo Client",
                "project_name": "WooCommerce Store Launch",
                "brief": "Synthetic demo project for WooCommerce store delivery from discovery through launch and maintenance.",
                "goals": "Launch a fully functional WooCommerce store with product catalog, cart, checkout, payment, and shipping.",
                "success_metrics": ["Conversion rate > 2%", "Page load < 3s", "Zero critical bugs at launch"],
                "target_audience": "B2C online shoppers",
                "regions": ["US", "EU"],
                "budget": 45000.00,
                "currency": "USD",
                "deadline": timezone.now().date() + timedelta(days=90),
                "launch_date": timezone.now().date() + timedelta(days=75),
                "staging_url": "https://staging.demo-woocommerce.local",
                "status": "active",
            },
        )
        if not created:
            self.stdout.write(f"Project {SLUG} already exists, updating...")

        demo_user, user_created = get_user_model().objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL, "first_name": "Demo", "last_name": "Advisor"},
        )
        demo_user.set_password(DEMO_PASSWORD)
        demo_user.save()
        project.members.add(demo_user)

        members_data = [
            ("Sarah Chen", "project_lead", "human", True),
            ("James Wright", "designer", "human", True),
            ("Maria Garcia", "developer", "human", True),
            ("David Kim", "senior_developer", "human", True),
            ("Lisa Park", "technical_lead", "human", True),
            ("Emma Wilson", "qa_tester", "human", True),
            ("Tom Baker", "woocommerce_specialist", "human", False),
            ("Ana Ruiz", "seo_specialist", "human", False),
            ("Kai Brooks", "copywriter", "human", False),
            ("Nina Patel", "client_lead", "human", True),
            ("Requirements Bot", "requirements_agent", "ai", False),
            ("UX Agent", "ux_agent", "ai", False),
            ("Design Assistant", "design_assistant", "ai", False),
            ("WP Dev Agent", "wordpress_developer_agent", "ai", False),
            ("Plugin Agent", "plugin_developer_agent", "ai", False),
            ("Woo Agent", "woocommerce_setup_agent", "ai", False),
            ("Content Agent", "content_agent", "ai", False),
            ("SEO Agent", "seo_agent", "ai", False),
            ("QA Agent", "qa_agent", "ai", False),
            ("Perf Agent", "performance_agent", "ai", False),
            ("Security Agent", "security_agent", "ai", False),
            ("Doc Agent", "documentation_agent", "ai", False),
        ]
        members = []
        for name, role, kind, client_access in members_data:
            member, _ = TeamMember.objects.get_or_create(
                project=project, name=name, defaults={
                    "role": role, "kind": kind, "client_access": client_access,
                }
            )
            members.append(member)

        human_members = [m for m in members if m.kind == "human"]
        ai_members = [m for m in members if m.kind == "ai"]
        owner_map = {
            "Project Management": human_members[0],
            "Discovery & Requirements": human_members[1],
            "UX & Visual Design": human_members[2],
            "Content & Copywriting": human_members[8],
            "Theme Development": human_members[3],
            "WooCommerce Configuration": human_members[6],
            "Plugin Development": human_members[4],
            "Integrations": human_members[4],
            "Product Migration": human_members[6],
            "SEO": human_members[7],
            "Performance Optimization": human_members[4],
            "Security & Compliance": human_members[4],
            "Testing & QA": human_members[5],
            "Launch & Deployment": human_members[4],
            "Training & Maintenance": human_members[0],
        }

        workstreams_data = [
            ("Project Management", "pm", 0, "Discovery", "Plans, tracks, and coordinates all delivery workstreams", "Weekly status reports, updated timeline", "All workstreams active and aligned to timeline", "Client approval at each phase gate", [1, 2]),
            ("Discovery & Requirements", "dr", 1, "Discovery", "Gather and document business requirements", "Requirements doc, sitemap, integration list", "Client signs off on requirements", "Client approves scope", [3, 4]),
            ("UX & Visual Design", "ux", 2, "Design", "Create wireframes, designs, and design system", "Wireframes, mockups, design system", "Design passes usability review", "Client approves designs", [5, 6]),
            ("Content & Copywriting", "content", 3, "Build", "Write product and marketing copy", "Approved copy for all pages", "Copy reviewed by client", "Client approves content", [7, 8]),
            ("Theme Development", "theme", 4, "Build", "Build the WooCommerce theme from designs", "Functional theme matching designs", "Theme renders all page templates", "Senior developer approves", [5, 6]),
            ("WooCommerce Configuration", "woo", 5, "Build", "Set up store structure, products, payments, shipping", "Configured store with test products", "All store features function correctly", "Project lead approves", [9]),
            ("Plugin Development", "plugin", 6, "Build", "Develop custom plugins and features", "Working custom features", "Features pass acceptance criteria", "Technical lead approves", [5, 6]),
            ("Integrations", "integrations", 7, "Build", "Connect third-party services and APIs", "Working integrations", "All integrations tested end-to-end", "Technical lead approves", [5, 6]),
            ("Product Migration", "migration", 8, "Build", "Migrate product catalog from source", "Products in WooCommerce with correct data", "All products importable via CSV", "WooCommerce specialist approves", [9, 10]),
            ("SEO", "seo", 9, "Build", "Implement SEO structure and metadata", "Sitemap, schema, metadata in place", "SEO audit passes", "SEO specialist approves", [11]),
            ("Performance Optimization", "perf", 10, "QA & Hardening", "Optimize page speed and core web vitals", "Performance report with scores", "Lighthouse scores above 90", "Technical lead approves", [5, 6]),
            ("Security & Compliance", "security", 11, "QA & Hardening", "Audit and harden security posture", "Security checklist complete", "No critical vulnerabilities", "Senior developer approves", [12]),
            ("Testing & QA", "qa", 12, "QA and Hardening", "Comprehensive testing of all features", "Test reports, bug fixes", "All test cases pass", "QA lead approves", [13]),
            ("Launch & Deployment", "launch", 13, "Launch", "Deploy to production and verify", "Deployed site, monitoring in place", "All launch checks pass", "Technical lead authorizes launch", [13, 14]),
            ("Training & Maintenance", "training", 14, "Post-Launch", "Train client and establish maintenance plan", "Training materials, maintenance runbook", "Client can operate store independently", "Project lead approves", [14, 15]),
        ]
        workstreams = []
        for name, slug, order, phase, desc, inputs, outputs, ac, deps in workstreams_data:
            ws, _ = Workstream.objects.get_or_create(
                project=project, slug=slug, defaults={
                    "name": name, "order": order, "description": desc,
                    "inputs": inputs, "outputs": outputs,
                    "acceptance_criteria": ac, "dependencies": deps,
                    "human_owner": owner_map[name],
                }
            )
            workstreams.append(ws)

        ai_by_role = {member.role: member for member in ai_members}
        ai_ws_map = {
            "Discovery & Requirements": ai_by_role["requirements_agent"],
            "UX & Visual Design": ai_by_role["ux_agent"],
            "Content & Copywriting": ai_by_role["content_agent"],
            "Theme Development": ai_by_role["wordpress_developer_agent"],
            "WooCommerce Configuration": ai_by_role["woocommerce_setup_agent"],
            "Plugin Development": ai_by_role["plugin_developer_agent"],
            "Integrations": ai_by_role["plugin_developer_agent"],
            "Product Migration": ai_by_role["woocommerce_setup_agent"],
            "SEO": ai_by_role["seo_agent"],
            "Performance Optimization": ai_by_role["performance_agent"],
            "Security & Compliance": ai_by_role["security_agent"],
            "Testing & QA": ai_by_role["qa_agent"],
            "Launch & Deployment": ai_by_role["wordpress_developer_agent"],
            "Training & Maintenance": ai_by_role["documentation_agent"],
        }
        for ws in workstreams:
            assistant = ai_ws_map.get(ws.name)
            if assistant:
                ws.ai_assistants.add(assistant)
            if ws.name == "UX & Visual Design":
                ws.contributors.add(ai_by_role["design_assistant"])
                ws.contributors.add(human_members[1])
            if ws.name == "Testing & QA":
                ws.contributors.add(human_members[4])
            ws.save()

        milestones_data = [
            ("Requirements Approved", "discovery", "Client approves requirements and scope"),
            ("Technical Plan Confirmed", "architecture", "Technical lead confirms buildability"),
            ("Design Approved", "design", "Client approves wireframes and mockups"),
            ("Feature-Complete Staging", "build", "All features developed and on staging"),
            ("QA Complete", "qa", "All tests pass and bugs resolved"),
            ("Client Acceptance Tested", "qa", "Client completes acceptance testing"),
            ("Launch Authorized", "launch", "Technical lead authorizes production launch"),
            ("Post-Launch Stable", "post_launch", "Store stable in production for 7 days"),
        ]
        for name, phase, desc in milestones_data:
            Milestone.objects.get_or_create(
                project=project, name=name, defaults={
                    "description": desc, "phase": phase,
                }
            )

        for name, dtype, approver, required in [
            ("Scope Approval", "client_facing", human_members[0], True),
            ("Plan Review", "technical", human_members[4], True),
            ("Design Approval", "client_facing", human_members[0], True),
            ("Feature Complete Sign-off", "production", human_members[4], True),
            ("QA Internal Approval", "production", human_members[5], True),
            ("Launch Authorization", "production", human_members[4], True),
            ("Budget Review", "financial", human_members[0], True),
            ("Security Sign-off", "security", human_members[4], True),
            ("Content Approval", "client_facing", human_members[0], True),
            ("Scope Change Request", "scope", human_members[0], True),
        ]:
            ApprovalGate.objects.get_or_create(
                project=project, name=name, defaults={
                    "description": f"Approval gate for {name.lower()}",
                    "decision_type": dtype, "approver": approver,
                    "required": required, "status": "pending",
                }
            )

        risk_data = [
            ("Scope creep during discovery", "high", "schedule", human_members[0], True, "Lock scope after client approval", "mitigating"),
            ("Third-party API downtime", "medium", "technical", human_members[3], True, "Implement retry logic and fallback", "identified"),
            ("Performance targets not met", "high", "technical", human_members[3], True, "Optimization workstream with clear targets", "mitigating"),
            ("Client delayed in feedback", "medium", "client", human_members[0], True, "Define SLA for client review windows", "identified"),
            ("Plugin compatibility issues", "medium", "technical", human_members[3], False, "Thorough testing on staging", "identified"),
            ("Data migration data loss", "critical", "technical", human_members[3], True, "Full backup and staged migration with rollback", "mitigating"),
            ("Security vulnerability discovered", "high", "security", human_members[3], True, "Security audit and patch management plan", "identified"),
            ("Budget overrun on custom features", "medium", "budget", human_members[0], True, "Regular budget reviews, change control process", "identified"),
            ("SEO ranking drop post-launch", "low", "other", human_members[7], True, "SEO monitoring and rapid fix protocol", "accepted"),
            ("Internal-only: Build tool bug", "low", "technical", human_members[3], False, "Tracked in internal backlog", "resolved"),
        ]
        for title, severity, category, owner, client_visible, mitigation, status_val in risk_data:
            Risk.objects.get_or_create(
                project=project, title=title, defaults={
                    "description": f"Synthetic risk: {title}", "severity": severity,
                    "category": category, "owner": owner, "client_visible": client_visible,
                    "mitigation": mitigation, "status": status_val,
                }
            )

        decision_data = [
            ("WooCommerce 8.x selected as platform version", "technical", human_members[4], "approved", True),
            ("Staging environment on separate subdomain", "technical", human_members[4], "approved", True),
            ("Stripe as primary payment processor", "financial", human_members[0], "approved", True),
            ("Flat rate shipping for initial launch", "scope", human_members[0], "approved", True),
            ("Custom product recommendation engine", "scope", human_members[0], "approved", True),
            ("Google Analytics 4 for tracking", "technical", human_members[7], "approved", True),
            ("AI-generated product descriptions approved for use", "production", human_members[0], "approved", True),
            ("Internal-only: Dev environment naming convention", "process", human_members[2], "approved", False),
            ("Internal-only: Daily standup at 9am", "process", human_members[0], "approved", False),
        ]
        for title, dtype, maker, outcome, client_visible in decision_data:
            DecisionLog.objects.get_or_create(
                project=project, title=title, defaults={
                    "description": f"Decision: {title}", "decision_type": dtype,
                    "decision_maker": maker, "outcome": outcome,
                    "client_visible": client_visible,
                }
            )

        task_assign_map = {
            "Project Management": human_members[0],
            "Discovery & Requirements": human_members[1],
            "UX & Visual Design": human_members[2],
            "Content & Copywriting": human_members[8],
            "Theme Development": human_members[3],
            "WooCommerce Configuration": human_members[6],
            "Plugin Development": human_members[4],
            "Integrations": human_members[4],
            "Product Migration": human_members[6],
            "SEO": human_members[7],
            "Performance Optimization": human_members[4],
            "Security & Compliance": human_members[4],
            "Testing & QA": human_members[5],
            "Launch & Deployment": human_members[4],
            "Training & Maintenance": human_members[0],
        }
        tasks_data = [
            ("Create requirements document", "Discovery & Requirements", "high", "in_progress", True, True, "Document all business requirements"),
            ("Build sitemap", "Discovery & Requirements", "medium", "not_started", False, False, ""),
            ("Design homepage wireframe", "UX & Visual Design", "high", "in_progress", True, True, "Wireframe for homepage"),
            ("Design product page layout", "UX & Visual Design", "high", "not_started", True, True, "Mobile responsive product page"),
            ("Configure product attributes", "WooCommerce Configuration", "high", "blocked", False, False, "Attribute set for variable products"),
            ("Write homepage copy", "Content & Copywriting", "medium", "in_progress", True, True, "Client brand voice"),
            ("Set up staging environment", "Launch & Deployment", "high", "in_progress", False, False, ""),
            ("Run security checklist", "Security & Compliance", "high", "not_started", False, False, ""),
            ("Create test plan", "Testing & QA", "high", "not_started", True, True, "Test all user journeys"),
        ]
        for title, ws_name, priority, status_val, client_req, client_input_text, dod in tasks_data:
            ws = next((w for w in workstreams if w.name == ws_name), None)
            if ws:
                reviewer = human_members[0]
                Task.objects.get_or_create(
                    workstream=ws, title=title, defaults={
                        "description": f"Task: {title}", "priority": priority,
                        "status": status_val, "assignee": task_assign_map.get(ws_name, human_members[0]),
                        "reviewer": reviewer, "client_input_required": client_req,
                        "definition_of_done": dod,
                    }
                )

        # Seed Product Categories and Products
        categories_data = [
            ("WordPress Plugins", "plugin", "plugin", "Custom WordPress plugins for WooCommerce and beyond", "Package", 0),
            ("App Subscriptions", "subscription", "subscription", "SaaS subscriptions and recurring services", "CreditCard", 1),
            ("Themes", "theme", "theme", "Premium WordPress and WooCommerce themes", "Shield", 2),
            ("Bundles", "bundle", "bundle", "Value-packed product bundles", "Star", 3),
        ]
        categories = {}
        for name, slug, type_val, desc, icon, order in categories_data:
            cat, _ = ProductCategory.objects.get_or_create(
                slug=slug, defaults={
                    "name": name, "type": type_val, "description": desc,
                    "icon": icon, "order": order, "is_active": True,
                }
            )
            categories[type_val] = cat

        products_data = [
            {
                "category": "plugin",
                "name": "WDA Advanced Subscriptions",
                "slug": "wda-advanced-subscriptions",
                "short_description": "Complete subscription management for WooCommerce with flexible billing cycles, trials, and automated renewals.",
                "description": "WDA Advanced Subscriptions transforms your WooCommerce store into a powerful subscription platform. Built for developers and store owners who need enterprise-grade recurring revenue tools without the complexity.\n\nKey capabilities:\n- Unlimited subscription products and plans\n- Flexible billing cycles (daily, weekly, monthly, yearly, custom)\n- Free trials with automatic conversion\n- Prorated upgrades/downgrades\n- Automated renewal emails and failed payment retries\n- Customer portal for self-service management\n- Webhook integration for external systems\n- Detailed analytics and MRR reporting\n- Compatible with all major payment gateways\n- WPML and multisite ready",
                "version": "2.4.1",
                "license_type": "unlimited",
                "billing_type": "yearly",
                "price": 199.00,
                "sale_price": 149.00,
                "sale_ends_at": timezone.now() + timedelta(days=14),
                "features": [
                    "Unlimited subscription products",
                    "Flexible billing cycles",
                    "Free trial management",
                    "Prorated plan changes",
                    "Automated renewal emails",
                    "Failed payment retry logic",
                    "Customer self-service portal",
                    "Webhook integrations",
                    "MRR analytics dashboard",
                    "WPML & Multisite support",
                ],
                "requirements": "WordPress 5.8+\nWooCommerce 7.0+\nPHP 7.4+\nMySQL 5.7+ or MariaDB 10.3+",
                "changelog": "v2.4.1 - Fixed trial conversion bug for yearly plans\nv2.4.0 - Added Stripe Checkout integration\nv2.3.2 - Improved customer portal UX\nv2.3.1 - Fixed webhook delivery for high-volume stores\nv2.3.0 - Added custom billing cycle support",
                "tags": ["woocommerce", "subscriptions", "recurring", "billing", "membership"],
                "is_featured": True,
                "sort_order": 0,
                "thumbnail": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
            },
            {
                "category": "plugin",
                "name": "WDA Checkout Optimizer",
                "slug": "wda-checkout-optimizer",
                "short_description": "Boost conversions with a streamlined, distraction-free checkout experience optimized for mobile and desktop.",
                "description": "WDA Checkout Optimizer replaces the default WooCommerce checkout with a conversion-focused, single-page experience. A/B tested across 50+ stores with an average 23% increase in checkout completion.\n\nFeatures:\n- Single-page, distraction-free checkout\n- Address autocomplete (Google Places API)\n- Express checkout with Apple Pay / Google Pay\n- Trust badges and security indicators\n- Order bump and upsell integration\n- Cart abandonment recovery emails\n- Custom fields and conditional logic\n- GDPR/CCPA compliance built-in\n- Full RTL support\n- Translation ready (20+ languages included)",
                "version": "1.8.3",
                "license_type": "multi",
                "billing_type": "yearly",
                "price": 149.00,
                "features": [
                    "Single-page checkout",
                    "Address autocomplete",
                    "Apple Pay / Google Pay",
                    "Trust badges",
                    "Order bumps & upsells",
                    "Abandonment recovery",
                    "Custom fields",
                    "GDPR/CCPA compliant",
                    "RTL support",
                    "20+ translations",
                ],
                "requirements": "WordPress 5.8+\nWooCommerce 7.0+\nPHP 7.4+\nSSL certificate required",
                "changelog": "v1.8.3 - Fixed Safari autofill issue\nv1.8.2 - Added Klarna payment support\nv1.8.1 - Improved mobile keyboard handling\nv1.8.0 - New order bump system",
                "tags": ["woocommerce", "checkout", "conversion", "optimization", "payments"],
                "is_featured": True,
                "sort_order": 1,
                "thumbnail": "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=600&fit=crop",
            },
            {
                "category": "plugin",
                "name": "WDA Product Bundles",
                "slug": "wda-product-bundles",
                "short_description": "Create flexible product bundles with dynamic pricing, mix-and-match options, and inventory synchronization.",
                "description": "WDA Product Bundles lets you sell curated product collections with intelligent pricing. Perfect for gift boxes, starter kits, and cross-sell bundles.\n\nCapabilities:\n- Fixed and dynamic bundle pricing\n- Mix-and-match with quantity rules\n- Inventory sync across bundle components\n- Bundle-specific shipping rules\n- Subscription bundle support\n- Volume discounts per bundle\n- Customizable bundle builder UI\n- Compatible with all product types\n- Import/export via CSV\n- Developer-friendly hooks and filters",
                "version": "3.1.0",
                "license_type": "developer",
                "billing_type": "yearly",
                "price": 249.00,
                "features": [
                    "Fixed & dynamic pricing",
                    "Mix-and-match builder",
                    "Inventory synchronization",
                    "Bundle shipping rules",
                    "Subscription bundles",
                    "Volume discounts",
                    "Customizable builder UI",
                    "All product types supported",
                    "CSV import/export",
                    "Developer hooks & filters",
                ],
                "requirements": "WordPress 5.8+\nWooCommerce 7.0+\nPHP 7.4+",
                "changelog": "v3.1.0 - Added subscription bundle support\nv3.0.2 - Fixed inventory sync for variable products\nv3.0.1 - Improved builder performance\nv3.0.0 - Major rewrite with React-based builder",
                "tags": ["woocommerce", "bundles", "kits", "cross-sell", "dynamic pricing"],
                "is_featured": False,
                "sort_order": 2,
                "thumbnail": "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&h=600&fit=crop",
            },
            {
                "category": "subscription",
                "name": "WDA Performance Monitoring",
                "slug": "wda-performance-monitoring",
                "short_description": "Real-time Core Web Vitals monitoring, automated alerts, and monthly performance reports for your WooCommerce store.",
                "description": "WDA Performance Monitoring keeps your store fast and your customers happy. Continuous monitoring with actionable insights.\n\nWhat's included:\n- 24/7 Core Web Vitals monitoring (LCP, FID, CLS)\n- Real-time alerts via Slack, email, or SMS\n- Monthly performance reports with trends\n- Automated Lighthouse CI integration\n- Performance budget enforcement\n- Historical comparison and regression detection\n- Third-party script impact analysis\n- Image optimization recommendations\n- Database query monitoring\n- CDN cache hit ratio tracking",
                "version": "1.0.0",
                "license_type": "single",
                "billing_type": "monthly",
                "price": 99.00,
                "features": [
                    "24/7 Core Web Vitals monitoring",
                    "Real-time alerts (Slack, Email, SMS)",
                    "Monthly performance reports",
                    "Lighthouse CI integration",
                    "Performance budgets",
                    "Regression detection",
                    "Script impact analysis",
                    "Image optimization tips",
                    "Database query monitoring",
                    "CDN cache tracking",
                ],
                "requirements": "WordPress 5.8+\nWooCommerce 7.0+\nServer access for agent installation\nPHP 7.4+",
                "changelog": "v1.0.0 - Initial release",
                "tags": ["performance", "monitoring", "core web vitals", "lighthouse", "speed"],
                "is_featured": True,
                "sort_order": 3,
                "thumbnail": "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop",
            },
            {
                "category": "subscription",
                "name": "WDA Security Scanner",
                "slug": "wda-security-scanner",
                "short_description": "Automated vulnerability scanning, malware detection, and security hardening for WordPress and WooCommerce.",
                "description": "WDA Security Scanner provides enterprise-grade security for your store. Continuous scanning with automated remediation guidance.\n\nProtection includes:\n- Daily vulnerability scans (WP core, plugins, themes)\n- Malware and backdoor detection\n- File integrity monitoring\n- Brute force attack prevention\n- WAF rule management\n- Security headers enforcement\n- SSL certificate monitoring\n- PCI DSS compliance checks\n- Automated patch recommendations\n- Incident response playbook",
                "version": "2.2.1",
                "license_type": "single",
                "billing_type": "monthly",
                "price": 79.00,
                "features": [
                    "Daily vulnerability scans",
                    "Malware detection",
                    "File integrity monitoring",
                    "Brute force prevention",
                    "WAF management",
                    "Security headers",
                    "SSL monitoring",
                    "PCI DSS checks",
                    "Patch recommendations",
                    "Incident playbook",
                ],
                "requirements": "WordPress 5.8+\nPHP 7.4+\nServer access for scanner\nCron job capability",
                "changelog": "v2.2.1 - Updated vulnerability database\nv2.2.0 - Added PCI DSS compliance module\nv2.1.0 - Improved malware signatures",
                "tags": ["security", "scanner", "malware", "vulnerability", "compliance"],
                "is_featured": False,
                "sort_order": 4,
                "thumbnail": "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&h=600&fit=crop",
            },
            {
                "category": "theme",
                "name": "WDA Storefront Pro",
                "slug": "wda-storefront-pro",
                "short_description": "A modern, block-based WooCommerce theme with full site editing, performance optimized, and accessibility ready.",
                "description": "WDA Storefront Pro is built for the future of WordPress. Leveraging Full Site Editing, it gives you complete visual control without code.\n\nHighlights:\n- Full Site Editing (FSE) compatible\n- Block-based homepage and templates\n- 15+ pre-built block patterns\n- WooCommerce block integration\n- Optimized for Core Web Vitals\n- WCAG 2.1 AA accessible\n- Dark mode support\n- Customizer-free workflow\n- Global styles and design tokens\n- One-click demo import",
                "version": "4.0.0",
                "license_type": "unlimited",
                "billing_type": "one_time",
                "price": 129.00,
                "sale_price": 99.00,
                "sale_ends_at": timezone.now() + timedelta(days=30),
                "features": [
                    "Full Site Editing",
                    "Block-based templates",
                    "15+ block patterns",
                    "WooCommerce blocks",
                    "Core Web Vitals optimized",
                    "WCAG 2.1 AA accessible",
                    "Dark mode",
                    "Customizer-free",
                    "Global styles",
                    "One-click demo import",
                ],
                "requirements": "WordPress 6.1+\nWooCommerce 7.0+\nPHP 7.4+\nGutenberg enabled",
                "changelog": "v4.0.0 - Full Site Editing release\nv3.2.1 - Fixed cart block styling\nv3.2.0 - Added dark mode support",
                "tags": ["theme", "woocommerce", "fse", "blocks", "accessibility", "performance"],
                "is_featured": True,
                "sort_order": 5,
                "thumbnail": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
            },
            {
                "category": "bundle",
                "name": "WDA Developer Toolkit",
                "slug": "wda-developer-toolkit",
                "short_description": "All our plugins, themes, and subscriptions in one package. Unlimited sites, lifetime updates, priority support.",
                "description": "The WDA Developer Toolkit is the ultimate package for agencies and developers building WooCommerce stores at scale.\n\nIncludes:\n- WDA Advanced Subscriptions (Unlimited)\n- WDA Checkout Optimizer (Unlimited)\n- WDA Product Bundles (Developer)\n- WDA Storefront Pro (Unlimited)\n- WDA Performance Monitoring (12 months)\n- WDA Security Scanner (12 months)\n- All future plugins and themes\n- Priority email & Slack support\n- Private Discord community\n- Early beta access\n- White-label license option",
                "version": "2024.1",
                "license_type": "developer",
                "billing_type": "lifetime",
                "price": 999.00,
                "sale_price": 699.00,
                "sale_ends_at": timezone.now() + timedelta(days=60),
                "features": [
                    "All current plugins (Unlimited)",
                    "All current themes (Unlimited)",
                    "12 months Performance Monitoring",
                    "12 months Security Scanner",
                    "All future products included",
                    "Priority email & Slack support",
                    "Private Discord community",
                    "Early beta access",
                    "White-label option",
                    "Lifetime updates",
                ],
                "requirements": "WordPress 5.8+\nWooCommerce 7.0+\nPHP 7.4+",
                "changelog": "2024.1 - Added Security Scanner\n2024.0 - Initial release",
                "tags": ["bundle", "developer", "agency", "unlimited", "lifetime", "toolkit"],
                "is_featured": True,
                "sort_order": 6,
                "thumbnail": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=600&fit=crop",
            },
        ]

        for pdata in products_data:
            cat = categories.get(pdata["category"])
            defaults = {
                "category": cat,
                "name": pdata["name"],
                "short_description": pdata["short_description"],
                "description": pdata["description"],
                "version": pdata["version"],
                "license_type": pdata["license_type"],
                "billing_type": pdata["billing_type"],
                "price": pdata["price"],
                "sale_price": pdata.get("sale_price"),
                "sale_ends_at": pdata.get("sale_ends_at"),
                "features": pdata["features"],
                "requirements": pdata.get("requirements", ""),
                "changelog": pdata.get("changelog", ""),
                "tags": pdata.get("tags", []),
                "is_featured": pdata.get("is_featured", False),
                "sort_order": pdata.get("sort_order", 0),
                "status": "active",
                "published_at": timezone.now(),
            }
            if "thumbnail" in pdata:
                defaults["thumbnail"] = pdata["thumbnail"]
            Product.objects.update_or_create(
                slug=pdata["slug"], defaults=defaults
            )

        self._seed_demo_project(
            slug="demo-multi-vendor-marketplace",
            client_name="Marketplace Co",
            project_name="MultiVendor Marketplace",
            brief="A multi-vendor marketplace for curated goods.",
            budget=75000.00,
            members=[
                ("Dana Reyes", "project_lead", "human", True),
                ("Marco Li", "developer", "human", True),
                ("Zoe Hart", "designer", "human", True),
                ("Ishan Patel", "senior_developer", "human", True),
                ("Eli Thompson", "qa_tester", "human", True),
                ("Claire Dubois", "woocommerce_specialist", "human", False),
                ("Rex the Architect", "requirements_agent", "ai", False),
                ("Wattson", "qa_agent", "ai", False),
            ],
            workstreams=[
                ("Project Management", "pm", 0),
                ("Platform Setup", "platform", 3),
                ("Catalog & Vendors", "catalog", 1),
                ("Orders & Payments", "orders", 3),
                ("UX & Design", "design", 2),
                ("Quality Assurance", "qa", 4),
            ],
            milestones=[
                ("Requirements Approved", "discovery", "Stakeholders sign off requirements"),
                ("MVP Platform Ready", "architecture", "Core platform scaffolded"),
                ("Payments Integrated", "build", "Stripe + payouts wired up"),
                ("UAT Complete", "qa", "Vendor and buyer UAT passed"),
                ("Marketplace Launch", "launch", "Go live"),
            ],
            tasks=[
                ("Define vendor onboarding flow", 1, 1, 3, "high", "in_progress"),
                ("Set up Stripe Connect", 3, 3, 3, "high", "not_started"),
                ("Design seller dashboard", 4, 2, 2, "medium", "in_progress"),
                ("Write marketplace acceptance tests", 5, 4, 4, "high", "not_started"),
            ],
            risks=[
                ("Payout delays to vendors", "high", "budget", 3, True, "Reserve fund and SLA tracking", "identified"),
                ("Vendor data quality", "medium", "technical", 1, True, "Validation and moderation pipeline", "identified"),
            ],
            decisions=[
                ("Stripe Connect for payouts", "financial", 0, "approved", True, "Standard accounts via Stripe Connect."),
            ],
            gates=[
                ("Payment Architecture Review", "financial", 0, True, "pending", ""),
                ("Seller Data Privacy Sign-off", "security", 0, True, "pending", ""),
            ],
        )

        self._seed_demo_project(
            slug="demo-membership-subscription-site",
            client_name="FitLife",
            project_name="Membership Subscription Site",
            brief="A health-and-wellness membership subscription site.",
            budget=32000.00,
            members=[
                ("Priya Shah", "project_lead", "human", True),
                ("Carlos Ruiz", "developer", "human", True),
                ("Maya Chen", "designer", "human", True),
                ("Nora Kim", "woocommerce_specialist", "human", True),
                ("Omar Dia", "seo_specialist", "human", False),
                ("Aria PlanBot", "content_agent", "ai", False),
                ("Echo", "seo_agent", "ai", False),
            ],
            workstreams=[
                ("Project Management", "pm", 0),
                ("Memberships & Content", "memberships", 1),
                ("Subscription Billing", "billing", 1),
                ("UX & Onboarding", "ux", 2),
                ("SEO & Growth", "seo", 4),
            ],
            milestones=[
                ("Content Structure Finalized", "discovery", "Membership tiers defined"),
                ("Subscription Flow Complete", "build", "Recurring billing working"),
                ("Onboarding Experience Ready", "design", "Member onboarding flows live"),
                ("Public Launch", "launch", "Site live with members"),
            ],
            tasks=[
                ("Configure membership plan tiers", 1, 1, 1, "high", "in_progress"),
                ("Set up webhooks for subscription lifecycle", 2, 1, 1, "high", "not_started"),
                ("Write onboarding email copy", 3, 1, 1, "medium", "in_progress"),
                ("Keyword research for fitness content", 4, 4, 4, "medium", "not_started"),
            ],
            risks=[
                ("Churn on trial expiry", "medium", "client", 0, True, "Exit-intent offers and drip re-engagement", "identified"),
            ],
            decisions=[
                ("MemberPress vs WooCommerce Subscriptions", "technical", 0, "approved", True, "WooCommerce Subscriptions selected."),
                ("Annual billing default", "financial", 0, "approved", True, "Annual is default, monthly optional."),
            ],
            gates=[
                ("Membership Data Architecture Review", "production", 0, True, "pending", ""),
            ],
        )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded demo project '{SLUG}' (created={created})"
        ))
        self.stdout.write(f"Demo login: {DEMO_USERNAME} / {DEMO_PASSWORD}")

    def _seed_demo_project(self, slug, client_name, project_name, brief, budget,
                           members, workstreams, milestones, tasks, risks, decisions, gates,
                           invoices=None):
        project, created = Project.objects.get_or_create(
            slug=slug,
            defaults={
                "client_name": client_name,
                "project_name": project_name,
                "brief": brief,
                "goals": "",
                "success_metrics": [],
                "target_audience": "B2C",
                "regions": ["US"],
                "budget": budget,
                "currency": "USD",
                "deadline": timezone.now().date() + timedelta(days=90),
                "launch_date": timezone.now().date() + timedelta(days=75),
                "staging_url": f"https://staging.{slug}.local",
                "status": "active",
            },
        )

        demo_user, _ = get_user_model().objects.get_or_create(
            username=DEMO_USERNAME,
            defaults={"email": DEMO_EMAIL, "first_name": "Demo", "last_name": "Advisor"},
        )
        project.members.add(demo_user)

        human_members = []
        for name, role, kind, client_access in members:
            member, _ = TeamMember.objects.get_or_create(
                project=project, name=name, defaults={
                    "role": role, "kind": kind, "client_access": client_access,
                }
            )
            if kind == "human":
                human_members.append(member)

        workstream_objs = []
        for idx, (name, ws_slug, owner_idx) in enumerate(workstreams):
            ws, _ = Workstream.objects.get_or_create(
                project=project, slug=ws_slug, defaults={
                    "name": name,
                    "order": idx,
                    "description": "",
                    "inputs": "",
                    "outputs": "",
                    "acceptance_criteria": "",
                    "dependencies": [],
                    "human_owner": human_members[owner_idx],
                }
            )
            workstream_objs.append(ws)

        milestone_objs = []
        for name, phase, desc in milestones:
            milestone, _ = Milestone.objects.get_or_create(
                project=project, name=name, defaults={"description": desc, "phase": phase}
            )
            milestone_objs.append(milestone)

        # Milestone installments: one deposit plus a per-milestone balance, so
        # the demo shows several payments against a single project.
        if invoices is None:
            invoices = [
                (f"Deposit — unlocks {milestone_objs[0].name}", 0, 0.40, "paid", 0),
                (f"{milestone_objs[len(milestone_objs) // 2].name} milestone payment", len(milestone_objs) // 2, 0.35, "sent", 14),
                ("Final payment on launch", len(milestone_objs) - 1, 0.25, "draft", 30),
            ]
        for label, milestone_idx, share, status, due_in in invoices:
            milestone = milestone_objs[milestone_idx] if milestone_objs else None
            ProjectInvoice.objects.get_or_create(
                project=project,
                label=label,
                defaults={
                    "milestone": milestone,
                    "description": f"Covers {milestone.name if milestone else 'project delivery'}.",
                    "amount": round(budget * share, 2),
                    "currency": "USD",
                    "status": status,
                    "due_date": timezone.now().date() + timedelta(days=due_in),
                    "paid_at": timezone.now() if status == "paid" else None,
                    "client_email": DEMO_EMAIL,
                },
            )

        for title, ws_idx, assignee_idx, reviewer_idx, priority, status in tasks:
            Task.objects.get_or_create(
                workstream=workstream_objs[ws_idx], title=title, defaults={
                    "description": f"Task: {title}",
                    "priority": priority,
                    "status": status,
                    "assignee": human_members[assignee_idx],
                    "reviewer": human_members[reviewer_idx],
                }
            )

        for title, severity, category, owner_idx, client_visible, mitigation, status in risks:
            Risk.objects.get_or_create(
                project=project, title=title, defaults={
                    "description": f"Risk: {title}",
                    "severity": severity,
                    "category": category,
                    "owner": human_members[owner_idx],
                    "client_visible": client_visible,
                    "mitigation": mitigation,
                    "status": status,
                }
            )

        for title, dtype, maker_idx, outcome, client_visible, desc in decisions:
            DecisionLog.objects.get_or_create(
                project=project, title=title, defaults={
                    "description": desc,
                    "decision_type": dtype,
                    "decision_maker": human_members[maker_idx],
                    "client_visible": client_visible,
                    "outcome": outcome,
                }
            )

        for name, dtype, approver_idx, required, status, desc in gates:
            ApprovalGate.objects.get_or_create(
                project=project, name=name, defaults={
                    "description": desc,
                    "decision_type": dtype,
                    "approver": human_members[approver_idx],
                    "required": required,
                    "status": status,
                }
            )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded demo project '{slug}' (created={created})"
        ))
