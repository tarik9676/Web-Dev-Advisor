import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Globe, Code, Zap, Lock, Shield, Cpu, ArrowRight, Check, HelpCircle } from 'lucide-react';
import { servicesApi } from '../../api/products.js';
import { resolveServiceIcon } from '../../lib/serviceIcons.js';

const STATIC_SERVICES = [
  {
    id: 'woocommerce',
    icon: Globe,
    title: 'WooCommerce Development',
    description: 'End-to-end store development from strategy to launch.',
    features: [
      'Custom theme development (classic & block themes)',
      'Headless WooCommerce (Next.js, React, Vue frontends)',
      'Multisite & multi-currency configurations',
      'Migration from Shopify, Magento, BigCommerce',
      'Custom checkout & cart experiences',
      'Product configurators & bundles',
    ],
    deliverables: [
      'Production-ready theme/plugin code',
      'CI/CD pipeline with automated testing',
      'Performance budget & Core Web Vitals report',
      'Security audit & hardening checklist',
      'Client training & documentation',
    ],
    timeline: '6–12 weeks',
    startingPrice: '$15,000',
  },
  {
    id: 'plugins',
    icon: Code,
    title: 'Custom Plugin Development',
    description: 'Bespoke plugins for unique business requirements.',
    features: [
      'Custom payment gateway integrations',
      'Shipping & fulfillment calculators',
      'Subscription & membership systems',
      'Custom product types & configurators',
      'Third-party API integrations (ERP, CRM, PIM)',
      'Admin UX improvements & custom blocks',
    ],
    deliverables: [
      'Production-ready plugin (PSR-12, WP Coding Standards)',
      'Automated test suite (unit + integration)',
      'Admin documentation & developer guide',
      'Composer/Composer-ready distribution',
      '6 months maintenance included',
    ],
    timeline: '4–8 weeks',
    startingPrice: '$8,000',
  },
  {
    id: 'performance',
    icon: Zap,
    title: 'Performance Optimization',
    description: 'Core Web Vitals optimization for conversion-critical stores.',
    features: [
      'Core Web Vitals audit & remediation',
      'Database query optimization & indexing',
      'Caching strategy (Redis, Varnish, CDN)',
      'Database query optimization & indexing',
      'Image optimization & next-gen formats',
      'Third-party script audit & deferral',
      'Load testing & capacity planning',
    ],
    deliverables: [
      'Before/after Core Web Vitals report',
      'Optimized caching configuration',
      'Database optimization scripts',
      'Monitoring dashboard (Grafana/Prometheus)',
      '30-day performance monitoring',
    ],
    timeline: '3–6 weeks',
    startingPrice: '$12,000',
  },
  {
    id: 'security',
    icon: Lock,
    title: 'Security & Compliance',
    description: 'Enterprise-grade security for transactional stores.',
    features: [
      'PCI DSS SAQ-A/SAQ-D readiness',
      'GDPR/CCPA data handling compliance',
      'OWASP Top 10 remediation',
      'Automated vulnerability scanning (CI/CD)',
      'WAF configuration & rule tuning',
      'Secure coding training for your team',
      'Incident response plan & runbooks',
    ],
    deliverables: [
      'Security audit report with risk ratings',
      'Remediation plan with timelines',
      'PCI DSS evidence package',
      'GDPR data flow documentation',
      'WAF ruleset & monitoring alerts',
      'Incident response runbook',
    ],
    timeline: '4–8 weeks',
    startingPrice: '$15,000',
  },
  {
    id: 'maintenance',
    icon: Shield,
    title: 'Maintenance & Support',
    description: 'Ongoing reliability for mission-critical stores.',
    tiers: [
      {
        name: 'Essential',
        price: '$500/mo',
        features: [
          'Weekly core/plugin/theme updates',
          'Daily automated backups (30-day retention)',
          'Uptime monitoring (5-min intervals)',
          'Security patching within 24h',
          'Email support (business hours)',
        ],
      },
      {
        name: 'Professional',
        price: '$1,500/mo',
        popular: true,
        features: [
          'Everything in Essential',
          'Performance monitoring & alerts',
          'Monthly performance report',
          'Staging environment management',
          'Priority email support (4h SLA)',
          'Quarterly performance review',
        ],
      },
      {
        name: 'Enterprise',
        price: '$3,500/mo',
        features: [
          'Everything in Professional',
          '24/7 monitoring & incident response',
          '1-hour critical incident SLA',
          'Dedicated Slack channel',
          'Monthly architecture review',
          'Disaster recovery testing (quarterly)',
          'Custom SLA & compliance reporting',
        ],
      },
    ],
  },
  {
    id: 'ai',
    icon: Cpu,
    title: 'AI-Accelerated Delivery',
    description: 'AI agents under human supervision for faster delivery.',
    features: [
      'Requirements analysis & user story generation',
      'Code generation (PHP, JS, CSS, SQL)',
      'Automated test generation (PHPUnit, Cypress)',
      'Documentation generation (README, PHPDoc, OpenAPI)',
      'Code review assistance & security scanning',
      'Migration script generation',
    ],
    benefits: [
      '40% faster delivery on average',
      'Consistent code quality & patterns',
      'Comprehensive test coverage by default',
      'Human review on every AI-generated artifact',
      'Full audit trail of AI contributions',
    ],
    note: 'Included at no extra cost on all projects.',
  }
];

const FAQ = [
  {
    question: 'How does human-AI collaboration work in practice?',
    answer: 'Our AI agents handle repetitive, well-defined tasks: generating boilerplate code, writing tests, creating documentation, analyzing requirements. Every AI output is reviewed and approved by a named human engineer before it enters the codebase. The human remains the decision-maker and owner of the outcome.'
  },
  {
    question: 'What makes your WooCommerce expertise different?',
    answer: 'We\'ve delivered 200+ WooCommerce projects ranging from simple stores to complex multi-vendor marketplaces. Our team includes WooCommerce core contributors, plugin authors, and performance specialists. We don\'t just build stores—we build scalable, maintainable platforms.'
  },
  {
    question: 'How do you handle project management and communication?',
    answer: 'Every project gets a dedicated pod: Project Lead, Designer, Senior Developer, QA Lead, WooCommerce Specialist, and AI agents. You get a dedicated Project Lead as your single point of contact, weekly syncs, real-time dashboard access, and shared Notion workspace.'
  },
  {
    question: 'What\'s your typical project timeline?',
    answer: 'Depends on scope: Simple store (6-8 weeks), Custom theme + plugins (10-14 weeks), Complex marketplace/migration (16-24 weeks). We provide detailed milestone plans with clear acceptance criteria for each phase.'
  },
  {
    question: 'Do you offer fixed-price or time & materials?',
    answer: 'Both. Fixed-price for well-scoped projects (custom plugins, migrations, audits). Time & materials for ongoing development, retainers, and exploratory work. We\'re transparent about which model fits your situation.'
  },
  {
    question: 'What\'s included in maintenance plans?',
    answer: 'All tiers include automated backups, security patching, uptime monitoring, and core updates. Professional adds performance monitoring, staging management, and quarterly reviews. Enterprise adds 24/7 incident response, dedicated Slack, and compliance reporting.'
  },
  {
    question: 'Do you work with agencies as a white-label partner?',
    answer: 'Yes. We white-label for agencies needing WooCommerce capacity. Your clients see your brand; we deliver the technical execution with full transparency and your project management tools.'
  },
];

function ServiceIcon({ icon, size = 28 }) {
  const Icon = resolveServiceIcon(icon);
  return <Icon size={size} />;
}

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await servicesApi.getAll({ status: 'active' });
      setServices(data);
    } catch (err) {
      console.error('Failed to load services:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const displayServices = services.length > 0 ? services : STATIC_SERVICES;

  if (loading) {
    return (
      <div className="services-page">
        <section className="page-hero" aria-labelledby="services-hero-title">
          <div className="hero-background">
            <div className="gradient-orb orb-1" />
            <div className="gradient-orb orb-2" />
          </div>
          <div className="container">
            <div className="skeleton-lines" style={{ maxWidth: '600px' }}>
              <span style={{ height: '40px', width: '60%' }} />
              <span style={{ height: '20px', width: '80%' }} />
            </div>
          </div>
        </section>
        <div className="container">
          <div className="skeleton-lines">
            <span style={{ height: '600px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="services-page">
      <section className="page-hero" aria-labelledby="services-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Services</span>
          </nav>
          <h1 id="services-hero-title">Our Services</h1>
          <p className="hero-description">
            End-to-end WooCommerce expertise. From custom development to ongoing maintenance—delivered by human-led pods with AI acceleration.
          </p>
        </div>
      </section>

      <section className="services-overview" aria-labelledby="services-overview-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Our Expertise</span>
            <h2 id="services-overview-title">Comprehensive WooCommerce Services</h2>
            <p className="section-description">
              Six core service areas covering the full lifecycle of your WooCommerce store. Each service is delivered by a dedicated human-led pod with AI acceleration.
            </p>
          </header>
          <div className="services-overview-grid">
            {displayServices.map((service, i) => (
              <article key={service.slug || service.id} className="service-overview-card">
                <div className="service-card-header">
                  <div className="service-icon-large">
                    <ServiceIcon icon={service.icon} size={28} />
                  </div>
                  <div>
                    <h3>{service.name || service.title}</h3>
                    <p>{service.short_description || service.description}</p>
                  </div>
                </div>
                <div className="service-highlights">
                  <h4>Key Capabilities</h4>
                  <ul>
                    {(service.features || []).slice(0, 4).map((feature, idx) => (
                      <li key={idx}><Check size={14} /> {feature}</li>
                    ))}
                  </ul>
                  {(service.features || []).length > 4 && (
                    <button className="expand-link" onClick={(e) => { e.preventDefault(); alert(`Full list: ${(service.features || []).join(', ')}`); }}>
                      +{(service.features || []).length - 4} more
                    </button>
                  )}
                </div>
                {service.timeline && (
                  <div className="service-meta">
                    <span className="meta-item"><span className="meta-icon" aria-hidden="true">⏱</span> Timeline: {service.timeline}</span>
                    <span className="meta-item"><span className="meta-icon" aria-hidden="true">$</span> From {service.starting_price || service.startingPrice}</span>
                  </div>
                )}
                {service.tiers && (
                  <div className="service-meta">
                    <span className="meta-item"><span className="meta-icon" aria-hidden="true">$</span> From {service.tiers[0]?.price}/mo</span>
                  </div>
                )}
                <div className="service-action">
                  <Link to={`/services/${service.slug || service.id}`} className="button secondary">
                    View Details <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Detailed Service Sections */}
      {displayServices.map((service) => (
        <section key={service.slug || service.id} id={service.slug || service.id} className="service-detail-section" aria-labelledby={`${service.slug || service.id}-title`}>
          <div className="container">
            <div className="service-detail-header">
              <div className="service-detail-icon">
                <ServiceIcon icon={service.icon} size={32} />
              </div>
              <div>
                <h2 id={`${service.slug || service.id}-title`}>{service.name || service.title}</h2>
                <p className="service-detail-description">{service.short_description || service.description}</p>
                <div className="service-meta-inline">
                  {service.timeline && <span><span className="meta-icon" aria-hidden="true">⏱</span> {service.timeline}</span>}
                  {service.starting_price && <span>Starting at <strong>{service.starting_price}</strong></span>}
                  {service.startingPrice && <span>Starting at <strong>{service.startingPrice}</strong></span>}
                </div>
              </div>
            </div>

            <div className="service-detail-grid">
              <div className="service-features">
                <h3>What\'s Included</h3>
                <ul className="feature-list">
                  {(service.features || []).map((feature, idx) => (
                    <li key={idx}><Check size={16} /> {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="service-deliverables">
                <h3>Deliverables</h3>
                <ul className="deliverable-list">
                  {(service.deliverables || []).map((deliverable, idx) => (
                    <li key={idx}><Check size={16} /> {deliverable}</li>
                  ))}
                </ul>
              </div>
            </div>

            {service.tiers && service.tiers.length > 0 && (
              <div className="pricing-tiers">
                <h3>Pricing Tiers</h3>
                <div className="tiers-grid">
                  {service.tiers.map((tier, idx) => (
                    <article key={idx} className={tier.popular ? 'tier-card popular' : 'tier-card'}>
                      {tier.popular && <span className="popular-badge">Most Popular</span>}
                      <h4>{tier.name}</h4>
                      <div className="tier-price">{tier.price}</div>
                      <ul className="tier-features">
                        {tier.features.map((feature, idx) => (
                          <li key={idx}><Check size={14} /> {feature}</li>
                        ))}
                      </ul>
                      <Link to="/contact" className="button secondary full-width">Get Started</Link>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {service.note && (
              <div className="service-note">
                <HelpCircle size={16} />
                <span>{service.note}</span>
              </div>
            )}
          </div>
        </section>
      ))}

      {/* FAQ Section */}
      <section className="faq-section" aria-labelledby="faq-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Frequently Asked</span>
            <h2 id="faq-title">Questions About Our Services</h2>
          </header>
          <div className="faq-grid">
            {FAQ.map((faq, i) => (
              <details key={i} className="faq-item">
                <summary>{faq.question}</summary>
                <p>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Discuss Your Project?</h2>
            <p>Let's talk about your requirements and create a delivery plan with clear milestones, human owners, and AI acceleration.</p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Start a Conversation</Link>
              <Link to="/pricing" className="button secondary large">View Detailed Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}