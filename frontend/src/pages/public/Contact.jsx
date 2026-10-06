import { useState } from 'react';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle, AlertCircle, MessageSquare, Briefcase, Globe, Users, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const CONTACT_INFO = [
  { icon: Mail, title: 'Email', value: 'hello@webdevadvisor.io', href: 'mailto:hello@webdevadvisor.io' },
  { icon: Phone, title: 'Phone', value: '+1 (512) 555-0123', href: 'tel:+15125550123' },
  { icon: MapPin, title: 'Office', value: 'Austin, TX / Remote-First', href: null },
];

const OFFICE_HOURS = [
  { days: 'Monday–Friday', hours: '9:00 AM – 6:00 PM CT' },
  { days: 'Saturday', hours: '10:00 AM – 2:00 PM CT' },
  { days: 'Sunday', hours: 'Closed' },
];

const FAQ_CONTACT = [
  {
    question: 'How quickly do you respond to inquiries?',
    answer: 'We typically respond within 2 business hours during business days. For urgent production issues, our Enterprise maintenance clients get 1-hour response SLA.'
  },
  {
    question: 'What information should I include in my initial inquiry?',
    answer: 'Helpful details: project type (new build, migration, plugin, audit), timeline, budget range, team size, current platform, and any specific technical requirements. The more context, the better we can prepare for our first call.'
  },
  {
    question: 'Do you sign NDAs before initial conversations?',
    answer: 'Yes. We\'re happy to sign a mutual NDA before any detailed technical discussions. Just let us know and we\'ll send ours or review yours.'
  },
  {
    question: 'Do you work with clients outside the US?',
    answer: 'Yes. We work with clients globally. Our team operates across multiple time zones and we\'re experienced in cross-border collaboration, compliance (GDPR, etc.), and multi-currency projects.'
  },
  {
    question: 'What\'s your typical project timeline?',
    answer: 'Discovery Sprint: 2 weeks. Project-Based: 6-16 weeks depending on scope. Dedicated Pods: ongoing monthly. Discovery Sprint is often the best starting point for complex projects.'
  },
  {
    question: 'Do you offer white-label services for agencies?',
    answer: 'Yes. We white-label for agencies needing WooCommerce capacity. Your clients see your brand; we deliver technical execution with full transparency. Volume discounts for 3+ concurrent projects.'
  },
];

const SERVICES_INTEREST = [
  { value: 'discovery', label: 'Discovery Sprint (2 weeks, $3,000)' },
  { value: 'project', label: 'Project-Based (Fixed price, from $15,000)' },
  { value: 'pod', label: 'Dedicated Pod (From $8,000/mo)' },
  { value: 'maintenance', label: 'Maintenance & Support (From $500/mo)' },
  { value: 'audit', label: 'Security/Performance Audit' },
  { value: 'consulting', label: 'Technical Consulting/Advisory' },
  { value: 'white-label', label: 'White-Label Partnership' },
  { value: 'other', label: 'Other / Not Sure' },
];

const BUDGET_RANGES = [
  { value: 'under-15k', label: 'Under $15,000' },
  { value: '15k-50k', label: '$15,000 – $50,000' },
  { value: '50k-100k', label: '$50,000 – $100,000' },
  { value: '100k-250k', label: '$100,000 – $250,000' },
  { value: '250k+', label: '$250,000+' },
  { value: 'not-sure', label: 'Not Sure / Exploring' },
];

const TIMELINE_RANGES = [
  { value: 'asap', label: 'ASAP' },
  { value: '1-3-months', label: '1–3 Months' },
  { value: '3-6-months', label: '3–6 Months' },
  { value: '6-12-months', label: '6–12 Months' },
  { value: 'flexible', label: 'Flexible / Exploring' },
];

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    service: 'project',
    budget: 'not-sure',
    timeline: 'flexible',
    message: '',
  });
  const [status, setStatus] = useState('idle'); // idle, submitting, success, error
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    if (formData.message.trim().length < 20) newErrors.message = 'Message must be at least 20 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus('submitting');
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      // In production: await fetch('/api/contact', { method: 'POST', body: JSON.stringify(formData) });
      setStatus('success');
      setFormData({
        name: '', email: '', company: '', role: '', service: 'project',
        budget: 'not-sure', timeline: 'flexible', message: '',
      });
    } catch {
      setStatus('error');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  return (
    <div className="contact-page">
      <section className="page-hero" aria-labelledby="contact-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Contact</span>
          </nav>
          <h1 id="contact-hero-title">Let's Start a Conversation</h1>
          <p className="hero-description">
            Every project begins with a conversation. Tell us about your goals, challenges, and timeline.
            We'll respond within 2 business hours with next steps.
          </p>
        </div>
      </section>

      <section className="contact-grid" aria-labelledby="contact-title">
        <div className="container">
          <div className="contact-layout">
            {/* Contact Form */}
            <section className="contact-form-section" aria-labelledby="form-title">
              <h2 id="form-title">Send Us a Message</h2>
              <p className="form-intro">We'll reply within 2 business hours. All fields marked * are required.</p>

              {status === 'success' && (
                <div className="form-success" role="alert">
                  <CheckCircle size={24} />
                  <div>
                    <strong>Message Sent!</strong>
                    <p>Thanks for reaching out. We'll get back to you within 2 business hours.</p>
                    <button className="button secondary" onClick={() => setStatus('idle')}>Send Another</button>
                  </div>
                </div>
              )}

              {status === 'error' && (
                <div className="form-error" role="alert">
                  <AlertCircle size={20} />
                  <span>Something went wrong. Please try again or email us directly at hello@webdevadvisor.io</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="contact-form" noValidate>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name">Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? 'name-error' : undefined}
                      required
                    />
                    {errors.name && <span id="name-error" className="error-message">{errors.name}</span>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">Email *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      required
                    />
                    {errors.email && <span id="email-error" className="error-message">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="company">Company</label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Your Role</label>
                    <input
                      type="text"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="service">Service Interest *</label>
                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      required
                    >
                      {SERVICES_INTEREST.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="budget">Budget Range</label>
                    <select
                      id="budget"
                      name="budget"
                      value={formData.budget}
                      onChange={handleChange}
                    >
                      {BUDGET_RANGES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="timeline">Timeline</label>
                    <select
                      id="timeline"
                      name="timeline"
                      value={formData.timeline}
                      onChange={handleChange}
                    >
                      {TIMELINE_RANGES.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="message">Message *</label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? 'message-error' : undefined}
                    placeholder="Tell us about your project, challenges, goals, timeline, and any specific requirements..."
                    required
                  />
                  {errors.message && <span id="message-error" className="error-message">{errors.message}</span>}
                </div>

                <button
                  type="submit"
                  className="button primary large full-width"
                  disabled={status === 'submitting'}
                >
                  {status === 'submitting' ? (
                    <>
                      <Loader2 size={18} className="spinning" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>

                <p className="form-footer">
                  By submitting this form, you agree to our <Link to="/privacy">Privacy Policy</Link> and <Link to="/terms">Terms of Service</Link>.
                </p>
              </form>
            </section>

            {/* Contact Info & FAQ */}
            <aside className="contact-sidebar">
              <div className="contact-info-card">
                <h3>Other Ways to Reach Us</h3>
                <ul className="contact-methods">
                  {CONTACT_INFO.map((method, i) => (
                    <li key={i} className="contact-method">
                      <method.icon size={20} />
                      <div>
                        <strong>{method.title}</strong>
                        {method.href ? (
                          <a href={method.href}>{method.value}</a>
                        ) : (
                          <span>{method.value}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="office-hours-card">
                <h3>Office Hours</h3>
                <ul className="office-hours">
                  {OFFICE_HOURS.map((item, i) => (
                    <li key={i}>
                      <span>{item.days}</span>
                      <span>{item.hours}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="quick-links-card">
                <h3>Quick Links</h3>
                <ul className="quick-links">
                  <li><Link to="/services"><Briefcase size={16} /> Services</Link></li>
                  <li><Link to="/pricing"><Globe size={16} /> Pricing</Link></li>
                  <li><Link to="/case-studies"><Shield size={16} /> Case Studies</Link></li>
                  <li><Link to="/about"><Users size={16} /> About Us</Link></li>
                  <li><Link to="/careers"><Briefcase size={16} /> Careers</Link></li>
                </ul>
              </div>

              <div className="faq-mini" aria-labelledby="faq-mini-title">
                <h3 id="faq-mini-title">Quick Answers</h3>
                <details>
                  <summary>How quickly do you respond?</summary>
                  <p>Within 2 business hours during business days.</p>
                </details>
                <details>
                  <summary>What should I include in my inquiry?</summary>
                  <p>Project type, timeline, budget range, current platform, and any specific requirements.</p>
                </details>
                <details>
                  <summary>Do you sign NDAs?</summary>
                  <p>Yes, we're happy to sign mutual NDAs before detailed discussions.</p>
                </details>
                <details>
                  <summary>Do you work internationally?</summary>
                  <p>Yes, we work with clients globally across multiple time zones.</p>
                </details>
                <details>
                  <summary>What's your typical timeline?</summary>
                  <p>Discovery: 2 weeks. Projects: 6-16 weeks. Pods: ongoing monthly.</p>
                </details>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="faq-section" aria-labelledby="faq-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Frequently Asked</span>
            <h2 id="faq-title">Common Questions</h2>
          </header>
          <div className="faq-grid">
            {FAQ_CONTACT.map((faq, i) => (
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
            <h2>Prefer to Schedule a Call?</h2>
            <p>Book a 30-minute discovery call directly on our calendar. No obligation, just a conversation about your project.</p>
            <div className="cta-actions">
              <a href="https://calendly.com/webdevadvisor" target="_blank" rel="noopener noreferrer" className="button primary large">
                <Globe size={18} /> Book a Discovery Call
              </a>
              <Link to="/services" className="button secondary large">Explore Services First</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}