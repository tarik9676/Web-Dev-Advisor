import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe, Users, Target, Lightbulb, BookOpen, Award, ArrowRight, Check } from 'lucide-react';

const VALUES = [
  { icon: ShieldCheck, title: 'Human Accountability', desc: 'AI produces; humans own. Every deliverable has a named human owner.' },
  { icon: Zap, title: 'AI-Accelerated', desc: '40% faster delivery through AI agents under human supervision.' },
  { icon: Globe, title: 'WooCommerce Specialists', desc: 'Deep platform expertise—core contributors, plugin authors, performance experts.' },
  { icon: Users, title: 'Dedicated Pods', desc: 'Cross-functional teams: lead, designer, dev, QA, specialist, AI agents.' },
  { icon: Target, title: 'Outcome-Focused', desc: 'Clear acceptance criteria, measurable milestones, human approval gates.' },
  { icon: Lightbulb, title: 'Continuous Learning', desc: 'ADRs, retrospectives, knowledge sharing—getting better every sprint.' },
];

const TEAM = [
  { name: 'Sarah Chen', role: 'Founder & CEO', bio: '15+ years WooCommerce, former Automattic. Core contributor. Writes about AI in e-commerce.', initials: 'SC' },
  { name: 'James Wright', role: 'Design Lead', bio: '12+ years UX/UI for e-commerce. Former Shopify Plus. Advocates accessible, conversion-focused design.', initials: 'JW' },
  { name: 'Maria Garcia', role: 'Engineering Lead', bio: 'WooCommerce core contributor. PHP 8+, React, performance optimization. Speaks at WordCamps globally.', initials: 'MG' },
  { name: 'David Kim', role: 'Technical Lead', bio: 'Architect of 50+ WooCommerce stores. Expert in headless, multisite, high-traffic scaling.', initials: 'DK' },
  { name: 'Lisa Park', role: 'Operations Lead', bio: 'Former agency COO. Built delivery frameworks for 100+ projects. Process & quality obsessed.', initials: 'LP' },
  { name: 'Emma Wilson', role: 'QA Lead', bio: 'Test automation expert. Cypress, Playwright, PHPUnit. Built our AI-assisted test generation pipeline.', initials: 'EW' },
];

const MILESTONES = [
  { year: '2019', title: 'Founded', desc: 'Started as boutique WooCommerce agency in Austin, TX.' },
  { year: '2020', title: 'First Major Migration', desc: 'Migrated $50M GMV store from Magento to WooCommerce in 12 weeks.' },
  { year: '2021', title: 'AI Integration', desc: 'Pioneered human-AI delivery model. 40% faster delivery validated across 50 projects.' },
  { year: '2022', title: 'Enterprise Clients', desc: 'Signed first $1M+ ARR enterprise client. PCI DSS, GDPR, SOC2 readiness.' },
  { year: '2023', title: 'AI Agent Framework', desc: 'Open-sourced our AI agent framework. Adopted by 200+ agencies globally.' },
  { year: '2024', title: '200+ Projects', desc: 'Delivered 200+ WooCommerce projects. 98% client retention. 4.9/5 avg rating.' },
];

const PRINCIPLES = [
  { title: 'Human Accountability', desc: 'AI produces bounded deliverables; named humans own every decision, approval, and outcome.' },
  { title: 'Review Before Release', desc: 'Client-facing, financial, security, production, and scope changes require human approval records.' },
  { title: 'One Source of Truth', desc: 'Requirements, decisions, dependencies, blockers, and acceptance criteria live in one workspace.' },
  { title: 'Parallel with Dependencies', desc: 'Discovery, design, build, QA, and launch run in parallel only when their inputs are ready.' },
  { title: 'Bounded AI', desc: 'AI agents operate within strict boundaries: defined inputs, testable outputs, human review gates.' },
  { title: 'Continuous Improvement', desc: 'Every project ends with a retrospective. ADRs, decisions, and lessons feed our playbook.' },
];

export default function About() {
  return (
    <div className="about-page">
      <section className="page-hero" aria-labelledby="about-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">About</span>
          </nav>
          <h1 id="about-hero-title">About Web Dev Advisor</h1>
          <p className="hero-description">
            We deliver production-ready WooCommerce stores 40% faster using AI agents under human supervision.
            Every line of code, every decision, every deployment—owned by a named human.
          </p>
        </div>
      </section>

      <section className="mission-section" aria-labelledby="mission-title">
        <div className="container">
          <div className="mission-content">
            <header className="section-header">
              <span className="section-badge">Our Mission</span>
              <h2 id="mission-title">Human-AI Collaboration That Delivers</h2>
            </header>
            <div className="mission-text">
              <p>
                We believe the best software is built when humans and AI collaborate with clear boundaries.
                AI agents handle the repetitive, well-defined work—generating boilerplate, writing tests,
                analyzing requirements, creating documentation. Humans own the decisions, the architecture,
                the client relationships, and the outcomes.
              </p>
              <p>
                This isn't about replacing humans with AI. It's about amplifying human expertise.
                Our engineers focus on architecture, client strategy, complex problem-solving, and the
                judgment calls that require experience and context. AI handles the repetitive scaffolding,
                boilerplate, test generation, and documentation.
              </p>
              <p>
                The result: 40% faster delivery, consistent quality, comprehensive test coverage,
                and—most importantly—clear human accountability for every line of code that ships.
              </p>
            </div>
            <div className="principles-grid">
              {PRINCIPLES.map((principle, i) => (
                <article key={i} className="principle-card">
                  <h3>{principle.title}</h3>
                  <p>{principle.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="team-section" aria-labelledby="team-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Our People</span>
            <h2 id="team-title">The Humans Behind the Work</h2>
            <p className="section-description">
              A team of WooCommerce experts, designers, engineers, and QA specialists.
              Every project is delivered by a named human team.
            </p>
          </header>
          <div className="team-grid">
            {TEAM.map((member, i) => (
              <article key={i} className="team-card">
                <div className="team-avatar">{member.initials}</div>
                <h3>{member.name}</h3>
                <p className="team-role">{member.role}</p>
                <p className="team-bio">{member.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="journey-section" aria-labelledby="journey-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Our Journey</span>
            <h2 id="journey-title">From Boutique to Industry Leader</h2>
          </header>
          <div className="timeline">
            {MILESTONES.map((milestone, i) => (
              <article key={i} className="timeline-item">
                <div className="timeline-marker">
                  <span className="timeline-year">{milestone.year}</span>
                </div>
                <div className="timeline-content">
                  <h3>{milestone.title}</h3>
                  <p>{milestone.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="values-section" aria-labelledby="values-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">Our Values</span>
            <h2 id="values-title">How We Work</h2>
          </header>
          <div className="values-grid">
            {VALUES.map((value, i) => (
              <article key={i} className="value-card">
                <div className="value-icon">
                  <value.icon size={24} />
                </div>
                <h3>{value.title}</h3>
                <p>{value.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content">
            <h2>Want to Work With Us?</h2>
            <p>We're always looking for exceptional humans who want to build the future of e-commerce with AI.</p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Get in Touch</Link>
              <Link to="/careers" className="button secondary large">View Careers</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}