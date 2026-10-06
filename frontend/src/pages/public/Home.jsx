import { ArrowRight, CheckCircle, Zap, Shield, Users, Globe, Code, TrendingUp, ShieldCheck, ZapIcon, BarChart3, Lock, Cpu, Globe as GlobeIcon, Users as UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const STATS = [
  { value: '200+', label: 'Projects Delivered' },
  { value: '98%', label: 'Client Retention' },
  { value: '40%', label: 'Faster Delivery with AI' },
  { value: '24/7', label: 'Support Available' },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Human-AI Collaboration', desc: 'Named human ownership on every deliverable. AI agents produce bounded, reviewable artifacts.' },
  { icon: Zap, title: '40% Faster Delivery', desc: 'AI agents handle repetitive work—requirements, code, tests—while humans own decisions.' },
  { icon: Globe, title: 'WooCommerce Specialists', desc: 'Deep platform expertise: custom themes, plugins, headless, multisite, migrations.' },
  { icon: Shield, title: 'Security First', desc: 'OWASP-aligned practices, PCI DSS readiness, automated security scanning on every deploy.' },
  { icon: Users, title: 'Dedicated Pods', desc: 'Cross-functional pods: lead, designer, dev, QA, WooCommerce specialist, AI agents.' },
  { icon: Code, title: 'Clean Code Standards', desc: 'PSR-12, automated testing, CI/CD, code review gates, documentation as code.' },
];

const SERVICES_PREVIEW = [
  { href: '/services#woocommerce', icon: GlobeIcon, title: 'WooCommerce Development', desc: 'Custom themes, headless, multisite, migrations, performance tuning.' },
  { href: '/services#plugins', icon: Code, title: 'Custom Plugin Development', desc: 'Bespoke plugins, payment gateways, shipping, subscriptions, APIs.' },
  { href: '/services#performance', icon: ZapIcon, title: 'Performance Optimization', desc: 'Core Web Vitals, caching, CDN, database tuning, load testing.' },
  { href: '/services#security', icon: Lock, title: 'Security & Compliance', desc: 'PCI DSS, GDPR, vulnerability scanning, WAF, secure coding practices.' },
  { href: '/services#maintenance', icon: Shield, title: 'Maintenance & Support', desc: '24/7 monitoring, updates, backups, SLA-backed response times.' },
  { href: '/services#ai', icon: Cpu, title: 'AI-Accelerated Delivery', desc: 'Requirements analysis, code generation, test writing, documentation.' },
];

const TRUST_INDICATORS = [
  { label: 'ISO 27001 Certified', icon: ShieldCheck },
  { label: 'WooCommerce Expert', icon: Globe },
  { label: 'PCI DSS Ready', icon: Lock },
  { label: 'GDPR Compliant', icon: UsersIcon },
];

export default function Home() {
  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
          <div className="grid-pattern" />
        </div>
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <span className="badge-dot" />
              <span>WooCommerce Experts · AI-Accelerated · Human-Owned Outcomes</span>
            </div>
            <h1 id="hero-title" className="hero-title">
              WooCommerce Development
              <br />
              <span className="highlight">AI-Accelerated</span>
              <br />
              <span className="sub-highlight">Human-Owned Outcomes</span>
            </h1>
            <p className="hero-description">
              We deliver production-ready WooCommerce stores 40% faster using AI agents under human supervision.
              Every line of code, every decision, every deployment—owned by a named human.
            </p>
            <div className="hero-actions">
              <Link to="/signup" className="button primary large">
                Start Your Project
              </Link>
              <Link to="/services" className="button secondary large">
                Explore Services
              </Link>
            </div>
            <div className="hero-trust">
              <div className="trust-item">
                <span className="trust-number">200+</span>
                <span className="trust-label">Projects Delivered</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-number">98%</span>
                <span className="trust-label">Client Retention</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-number">40%</span>
                <span className="trust-label">Faster with AI</span>
              </div>
              <div className="trust-divider" />
              <div className="trust-item">
                <span className="trust-number">24/7</span>
                <span className="trust-label">Support</span>
              </div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="dashboard-preview">
              <div className="preview-header">
                <div className="preview-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="preview-title">Project Dashboard</span>
              </div>
              <div className="preview-content">
                <div className="preview-metric">
                  <span className="metric-label">Launch Readiness</span>
                  <span className="metric-value">87%</span>
                </div>
                <div className="preview-chart">
                  <div className="chart-bars">
                    <span style={{height: '40%'}} />
                    <span style={{height: '65%'}} />
                    <span style={{height: '85%'}} />
                    <span style={{height: '55%'}} />
                    <span style={{height: '90%'}} />
                    <span style={{height: '70%'}} />
                    <span style={{height: '95%'}} />
                  </div>
                </div>
                <div className="preview-statuses">
                  <div className="status-item">
                    <span className="status-dot green" />
                    <span>Discovery</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot green" />
                    <span>Design</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot amber" />
                    <span>Build</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot" />
                    <span>QA</span>
                  </div>
                  <div className="status-item">
                    <span className="status-dot" />
                    <span>Launch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="trust-bar" aria-label="Trust indicators">
        <div className="container">
          <div className="trust-grid">
            {TRUST_INDICATORS.map((item, i) => (
              <div key={i} className="trust-item-card">
                <item.icon size={20} className="trust-icon" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="features-section" aria-labelledby="features-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Why Web Dev Advisor</span>
            <h2 id="features-title">Human-AI Collaboration That Delivers</h2>
            <p className="section-description">
              We don't just use AI—we orchestrate it. Every deliverable has a named human owner.
              AI agents handle the repetitive work; humans own the decisions.
            </p>
          </header>
          <div className="features-grid">
            {FEATURES.map((feature, i) => (
              <article key={i} className="feature-card">
                <div className="feature-icon">
                  <feature.icon size={24} />
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" aria-label="Company statistics">
        <div className="container">
          <div className="stats-grid">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-card">
                <span className="stat-value">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="services-preview" aria-labelledby="services-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Our Expertise</span>
            <h2 id="services-title">End-to-End WooCommerce Services</h2>
            <p className="section-description">
              From strategy to launch and beyond. Every service delivered by human-led pods with AI acceleration.
            </p>
          </header>
          <div className="services-grid">
            {SERVICES_PREVIEW.map((service, i) => (
              <Link key={i} to={service.href} className="service-card">
                <div className="service-icon">
                  <service.icon size={24} />
                </div>
                <h3>{service.title}</h3>
                <p>{service.desc}</p>
                <span className="service-link">
                  Learn more <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/services" className="button primary large">View All Services</Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-container">
          <div className="cta-content">
            <h2 id="cta-title">Ready to Launch Your WooCommerce Project?</h2>
            <p>Let's discuss your requirements and create a delivery plan with clear milestones, human owners, and AI acceleration.</p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Start a Conversation</Link>
              <Link to="/pricing" className="button secondary large">View Pricing</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}