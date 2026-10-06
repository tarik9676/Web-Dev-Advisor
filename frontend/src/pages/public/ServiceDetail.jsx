import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight, Check, HelpCircle, ArrowLeft
} from 'lucide-react';
import { servicesApi } from '../../api/products.js';
import { resolveServiceIcon } from '../../lib/serviceIcons.js';

export default function ServiceDetail() {
  const { serviceSlug } = useParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadService();
  }, [serviceSlug]);

  const loadService = async () => {
    try {
      const data = await servicesApi.getById(serviceSlug);
      setService(data);
    } catch (err) {
      setError('Failed to load service');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="service-detail-page">
        <div className="container">
          <div className="skeleton-lines">
            <span style={{ height: '200px' }} />
            <span style={{ height: '400px' }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="service-detail-page">
        <div className="container">
          <div className="error-state">
            <HelpCircle size={48} />
            <h2>Service Not Found</h2>
            <p>The service you're looking for doesn't exist or has been removed.</p>
            <Link to="/services" className="button primary">View All Services</Link>
          </div>
        </div>
      </div>
    );
  }

  const IconComponent = resolveServiceIcon(service.icon);

  // Check if service has blocks for page builder content
  const hasBlocks = service.blocks && service.blocks.length > 0;

  return (
    <div className="service-detail-page">
      <nav className="breadcrumb-bar" aria-label="Breadcrumb">
        <div className="container">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/services" className="breadcrumb-link">Services</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <span className="breadcrumb-current" aria-current="page">{service.name}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="service-hero" aria-labelledby="service-title">
        <div className="container">
          <div className="service-hero-grid">
            <div className="service-hero-content">
              <Link to="/services" className="back-link">
                <ArrowLeft size={16} /> Back to Services
              </Link>
              <span className="service-badge">Expert Service</span>
              <h1 id="service-title">{service.name}</h1>
              <p className="service-tagline">{service.short_description || service.description}</p>
              <div className="service-meta">
                {service.timeline && (
                  <div className="meta-item">
                    <span className="meta-icon" aria-hidden="true">⏱</span>
                    <span>Timeline: {service.timeline}</span>
                  </div>
                )}
                {(service.starting_price || service.startingPrice) && (
                  <div className="meta-item">
                    <span className="meta-icon" aria-hidden="true">$</span>
                    <span>Starting at {service.starting_price || service.startingPrice}</span>
                  </div>
                )}
                {service.tiers && service.tiers.length > 0 && (
                  <div className="meta-item">
                    <span className="meta-icon" aria-hidden="true">$</span>
                    <span>From {service.tiers[0]?.price}/mo</span>
                  </div>
                )}
              </div>
              <div className="service-hero-actions">
                <Link to="/contact" className="button primary large">
                  <ArrowRight size={18} /> Start a Conversation
                </Link>
                <Link to="/pricing" className="button secondary large">View Detailed Pricing</Link>
              </div>
            </div>
            <div className="service-hero-visual">
              <div className="service-icon-large">
                <IconComponent size={64} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Structured detail content. The canvas lives on its own landing route
          (/s/<slug>), so this always renders regardless of block state. */}
      {(
        <>
          {/* Features & Deliverables */}
          <section className="service-details" aria-labelledby="details-title">
            <div className="container">
              <header className="section-header">
                <h2 id="details-title">What's Included</h2>
              </header>
              <div className="service-detail-grid">
                <div className="service-features">
                  <h3>Key Capabilities</h3>
                  <ul className="feature-list">
                    {(service.features || []).map((feature, idx) => (
                      <li key={idx}><Check size={18} /> {feature}</li>
                    ))}
                  </ul>
                </div>
                <div className="service-deliverables">
                  <h3>Deliverables</h3>
                  <ul className="deliverable-list">
                    {(service.deliverables || []).map((deliverable, idx) => (
                      <li key={idx}><Check size={18} /> {deliverable}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing Tiers */}
          {service.tiers && service.tiers.length > 0 && (
            <section className="service-pricing" aria-labelledby="pricing-title">
              <div className="container">
                <header className="section-header">
                  <h2 id="pricing-title">Pricing Tiers</h2>
                </header>
                <div className="tiers-grid">
                  {service.tiers.map((tier, idx) => (
                    <article key={idx} className={tier.popular ? 'tier-card popular' : 'tier-card'}>
                      {tier.popular && <span className="popular-badge">Most Popular</span>}
                      <h4>{tier.name}</h4>
                      <div className="tier-price">{tier.price}</div>
                      <ul className="tier-features">
                        {tier.features?.map((feature, idx) => (
                          <li key={idx}><Check size={16} /> {feature}</li>
                        ))}
                      </ul>
                      <Link to="/contact" className="button secondary full-width">Get Started</Link>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Note */}
          {service.note && (
            <section className="service-note-section">
              <div className="container">
                <div className="service-note">
                  <HelpCircle size={20} />
                  <span>{service.note}</span>
                </div>
              </div>
            </section>
          )}

          {/* FAQ */}
          {service.faqs && service.faqs.length > 0 && (
            <section className="service-faq" aria-labelledby="faq-title">
              <div className="container">
                <header className="section-header">
                  <h2 id="faq-title">Frequently Asked Questions</h2>
                </header>
                <div className="faq-grid">
                  {service.faqs.map((faq, idx) => (
                    <details key={idx} className="faq-item">
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </div>
            </section>
          )}
        </>
      )}

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