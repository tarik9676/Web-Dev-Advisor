import { Link } from 'react-router-dom';
import { Check, HelpCircle, Shield, Zap, Users, Globe, Lock, Cpu, BarChart3, ShieldCheck } from 'lucide-react';

const PRICING_TIERS = [
  {
    name: 'Discovery Sprint',
    subtitle: 'Clarity before commitment',
    price: '$3,000',
    period: 'one-time',
    description: 'A structured 2-week discovery to define scope, architecture, and delivery plan.',
    idealFor: 'Teams validating complex requirements before full engagement',
    features: [
      'Stakeholder interviews & requirements workshop',
      'Technical architecture review & recommendations',
      'Risk assessment & mitigation strategy',
      'Detailed project plan with milestones',
      'Team composition & timeline proposal',
      'Go/no-go decision framework',
    ],
    cta: 'Start Discovery',
    ctaHref: '/contact',
    popular: false,
  },
  {
    name: 'Project-Based',
    subtitle: 'Fixed scope, fixed price',
    price: 'From $15,000',
    period: 'per project',
    description: 'Fixed-scope delivery with clear milestones, human ownership, and AI acceleration.',
    idealFor: 'Well-defined projects: migrations, custom plugins, audits, launches',
    features: [
      'Fixed scope, timeline, and price',
      'Named human ownership on all deliverables',
      'AI-accelerated delivery (40% faster)',
      'Weekly stakeholder demos & retrospectives',
      'Comprehensive test suite & documentation',
      '30-day post-launch support included',
    ],
    cta: 'Discuss Project',
    ctaHref: '/contact',
    popular: true,
    badge: 'Most Popular',
  },
  {
    name: 'Dedicated Pod',
    subtitle: 'Ongoing capacity',
    price: 'From $8,000/mo',
    period: 'monthly',
    description: 'A dedicated cross-functional pod as an extension of your team.',
    idealFor: 'Ongoing development, platform evolution, continuous improvement',
    features: [
      'Dedicated pod (Lead, Dev, QA, Designer, Woo Specialist)',
      'AI agents included at no extra cost',
      'Sprint planning & weekly demos',
      'Shared Notion workspace & real-time dashboard',
      'Architecture decisions documented (ADRs)',
      'Quarterly architecture review',
      'Priority support with 4h SLA',
    ],
    cta: 'Build a Pod',
    ctaHref: '/contact',
    popular: false,
  },
  {
    name: 'Maintenance Plans',
    subtitle: 'Ongoing reliability',
    price: 'From $500/mo',
    period: 'monthly',
    description: 'Tiered maintenance & support for production stores.',
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
];

const ENGAGEMENT_MODELS = [
  {
    icon: Zap,
    title: 'Fixed-Price Projects',
    description: 'Clear scope, fixed timeline, fixed price. Best for migrations, custom plugins, audits, and launches with well-defined requirements.',
  },
  {
    icon: Users,
    title: 'Dedicated Pods',
    description: 'A cross-functional pod as your extended team. Monthly capacity with full transparency, weekly demos, and shared planning.',
  },
  {
    icon: Shield,
    title: 'Maintenance & Support',
    description: 'Tiered ongoing support for production stores. From essential updates to 24/7 enterprise coverage with custom SLAs.',
  },
  {
    icon: Cpu,
    title: 'AI-Accelerated Delivery',
    description: 'Included at no extra cost on all engagements. AI agents handle repetitive work under human supervision—40% faster delivery.',
  },
];

const FAQ = [
  {
    question: 'Can I switch between engagement models?',
    answer: 'Yes. Many clients start with a Discovery Sprint, move to a Project-Based engagement, then transition to a Dedicated Pod for ongoing work. We\'re flexible.'
  },
  {
    question: 'What\'s included in the Discovery Sprint deliverables?',
    answer: 'You receive: stakeholder interview summary, requirements document, technical architecture diagram, risk register, detailed project plan with milestones, team composition recommendation, and a go/no-go decision framework.'
  },
  {
    question: 'Are there hidden costs?',
    answer: 'No. Our proposals include all development, testing, deployment, documentation, and 30-day post-launch support. Third-party costs (hosting, premium plugins, SSL certs) are identified upfront and billed at cost.'
  },
  {
    question: 'How do you handle scope changes in fixed-price projects?',
    answer: 'We use a formal change request process: impact analysis (timeline, cost, risk), written approval, updated milestone plan. Small adjustments within 5% effort are absorbed; larger changes require a formal amendment.'
  },
  {
    question: 'Can I hire your team for staff augmentation?',
    answer: 'Yes. We offer staff augmentation with our senior engineers and WooCommerce specialists. Minimum 3-month engagement. They integrate into your processes, attend your ceremonies, and work from your backlog.'
  },
  {
    question: 'Do you offer volume discounts for agencies?',
    answer: 'Yes. Agencies bringing 3+ concurrent projects or 12+ month commitments receive 10-15% volume discounts. White-label delivery available.'
  },
  {
    question: 'What payment terms do you offer?',
    answer: 'Discovery Sprint: 50% upfront, 50% on delivery. Project-Based: 30% upfront, 40% at mid-point demo, 30% on launch. Dedicated Pod: Monthly in advance. Maintenance: Monthly in advance. Net-15 for established clients.'
  },
];

export default function Pricing() {
  return (
    <div className="pricing-page">
      <section className="page-hero" aria-labelledby="pricing-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Pricing</span>
          </nav>
          <h1 id="pricing-hero-title">Transparent Pricing</h1>
          <p className="hero-description">
            No hidden fees. No surprise invoices. Choose the engagement model that fits your stage and scale.
          </p>
        </div>
      </section>

      <section className="engagement-models" aria-labelledby="models-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Engagement Models</span>
            <h2 id="models-title">Four Ways to Work Together</h2>
            <p className="section-description">
              From one-off discovery to ongoing dedicated pods. Choose the model that matches your stage and goals.
            </p>
          </header>
          <div className="models-grid">
            {ENGAGEMENT_MODELS.map((model, i) => (
              <article key={i} className="model-card">
                <div className="model-icon">
                  <model.icon size={28} />
                </div>
                <h3>{model.title}</h3>
                <p>{model.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="pricing-tiers-section" aria-labelledby="tiers-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Project & Retainer Pricing</span>
            <h2 id="tiers-title">Choose Your Starting Point</h2>
            <p className="section-description">
              All tiers include human ownership, AI acceleration, and 30-day post-launch support.
              Prices are starting points—final quote after discovery.
            </p>
          </header>
          <div className="pricing-cards">
            {PRICING_TIERS.slice(0, 3).map((tier, i) => (
              <article key={i} className={tier.popular ? 'pricing-card popular' : 'pricing-card'}>
                {tier.popular && <span className="popular-badge">{tier.badge}</span>}
                <header className="card-header">
                  <div className="tier-icon">
                    {tier.icon && <tier.icon size={24} />}
                  </div>
                  <h3>{tier.name}</h3>
                  <p className="tier-subtitle">{tier.subtitle}</p>
                </header>
                <div className="tier-price">
                  <span className="price">{tier.price}</span>
                  <span className="period">{tier.period}</span>
                </div>
                <p className="tier-description">{tier.description}</p>
                <p className="ideal-for"><strong>Ideal for:</strong> {tier.idealFor}</p>
                <ul className="tier-features">
                  {tier.features?.map((feature, idx) => (
                    <li key={idx}><ShieldCheck size={14} /> {feature}</li>
                  ))}
{tier.tiers && tier.tiers.map((t, idx) => (
                      <li key={idx} className="sub-feature">
                        {t.name}: {t.price} — {t.features.slice(0, 3).join(', ')}...
                      </li>
                    ))}
                </ul>
                <Link to={tier.ctaHref} className={tier.popular ? 'button primary full-width' : 'button secondary full-width'}>
                  {tier.cta}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="maintenance-pricing" aria-labelledby="maintenance-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Maintenance</span>
            <h2>Ongoing Maintenance & Support</h2>
            <p className="section-description">Three tiers of ongoing reliability for your production store.</p>
          </header>
          <div className="maintenance-cards">
            {PRICING_TIERS[3].tiers.map((tier, i) => (
              <article key={i} className={tier.popular ? 'maintenance-card popular' : 'maintenance-card'}>
                {tier.popular && <span className="popular-badge">Most Popular</span>}
                <header className="card-header">
                  <h3>{tier.name}</h3>
                  <div className="tier-price"><span className="price">{tier.price}</span><span className="period">/mo</span></div>
                </header>
                <ul className="tier-features">
                  {tier.features.map((feature, idx) => (
                    <li key={idx}><Check size={14} /> {feature}</li>
                  ))}
                </ul>
                <Link to="/contact" className="button secondary full-width">Select {tier.name}</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Frequently Asked</span>
            <h2 id="faq-title">Pricing & Engagement FAQ</h2>
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

      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content">
            <h2>Ready for a Custom Quote?</h2>
            <p>Every project is unique. Let's discuss your requirements and provide a detailed proposal with timeline, team composition, and fixed pricing.</p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Get a Custom Quote</Link>
              <Link to="/services" className="button secondary large">Explore Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}