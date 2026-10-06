import { Link } from 'react-router-dom';
import { ArrowRight, Globe, Zap, Lock, Shield, TrendingUp, BarChart3, CheckCircle, ExternalLink } from 'lucide-react';
import CASE_STUDIES, { FILTER_CATEGORIES } from '../../data/caseStudies.js';

export default function CaseStudies() {
  return (
    <div className="case-studies-page">
      <section className="page-hero" aria-labelledby="case-studies-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Case Studies</span>
          </nav>
          <h1 id="case-studies-hero-title">Case Studies</h1>
          <p className="hero-description">
            Real projects, measurable results. Every case study represents a real client, real challenges, and real outcomes.
          </p>
        </div>
      </section>

      <section className="case-studies-filters" aria-label="Filter case studies">
        <div className="container">
          <div className="filter-chips" role="tablist" aria-label="Filter by category">
            {FILTER_CATEGORIES.map((filter) => (
              <button
                key={filter.value}
                className={`filter-chip${filter.value === 'all' ? ' active' : ''}`}
                role="tab"
                aria-selected={filter.value === 'all'}
                aria-controls={`panel-${filter.value}`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="case-studies-grid" aria-labelledby="case-studies-title">
        <div className="container">
          <div className="case-studies-grid">
            {CASE_STUDIES.map((study, i) => (
              <article key={study.id} className="case-study-card">
                <div className="case-study-image">
                  <div className="image-placeholder">
                    <div className="placeholder-pattern" />
                    <div className="overlay">
                      <Link to={`/case-studies/${study.id}`} className="view-project">
                        View Project <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                  <div className="case-study-tags">
                    {study.tags.map((tag, idx) => (
                      <span key={idx} className="tag">{tag}</span>
                    ))}
                  </div>
                </div>
                <div className="case-study-content">
                  <div className="case-meta">
                    <span className="client">{study.client}</span>
                    <span className="industry">{study.industry}</span>
                  </div>
                  <h3 id={`case-studies-title-${i}`}>{study.title}</h3>
                  <p className="case-description">{study.challenge}</p>
                  <div className="case-results">
                    {study.results.slice(0, 3).map((result, idx) => (
                      <div key={idx} className="result-item">
                        <span className="result-value">{result.value}</span>
                        <span className="result-label">{result.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="case-meta-bottom">
                    <span className="timeline"><TrendingUp size={14} /> {study.timeline}</span>
                    <span className="team">{study.teamSize}</span>
                  </div>
                  <Link to={`/case-studies/${study.id}`} className="card-link">
                    View Case Study <ArrowRight size={14} />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="detailed-case-studies" aria-labelledby="detailed-title">
        <div className="container">
          <header className="section-header">
            <h2 id="detailed-title">Detailed Case Studies</h2>
            <p className="section-description">Deep dive into our most complex and impactful projects.</p>
          </header>
          <div className="detailed-grid">
            {CASE_STUDIES.map((study) => (
              <article key={study.id} className="detailed-case-study" id={study.id}>
                <header className="detailed-header">
                  <div className="detailed-meta">
                    <span className="client">{study.client}</span>
                    <span className="industry">{study.industry}</span>
                  </div>
                  <h2>{study.title}</h2>
                  <div className="detailed-meta-bottom">
                    <span><TrendingUp size={14} /> {study.timeline}</span>
                    <span><span className="icon" aria-hidden="true">👥</span> {study.teamSize}</span>
                  </div>
                </header>

                <div className="detailed-grid">
                  <div className="detailed-main">
                    <section className="detailed-section">
                      <h3>Challenge</h3>
                      <p>{study.challenge}</p>
                    </section>
                    <section className="detailed-section">
                      <h3>Our Approach</h3>
                      <ul className="approach-list">
                        {study.solution.map((item, idx) => (
                          <li key={idx}><CheckCircle size={16} /> {item}</li>
                        ))}
                      </ul>
                    </section>
                  </div>

                  <aside className="detailed-sidebar">
                    <div className="results-panel">
                      <h3>Results</h3>
                      <div className="results-grid">
                        {study.results.map((result, idx) => (
                          <div key={idx} className="result-card">
                            <span className="result-value">{result.value}</span>
                            <span className="result-label">{result.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="tech-stack">
                      <h3>Tech Stack</h3>
                      <div className="tech-tags">
                        {study.tags.map((tag, idx) => (
                          <span key={idx} className="tech-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="team-info">
                      <h3>Team</h3>
                      <p>{study.teamSize}</p>
                    </div>
                    <div className="timeline-info">
                      <h3>Timeline</h3>
                      <p>{study.timeline}</p>
                    </div>
                  </aside>
                </div>

                <section className="testimonial-section">
                  <blockquote className="testimonial">
                    <p>"{study.testimonial.quote}"</p>
                    <footer>— {study.testimonial.author}</footer>
                  </blockquote>
                </section>

                <div className="case-cta">
                  <Link to="/contact" className="button primary">Start a Similar Project</Link>
                  <Link to="/services" className="button secondary">Explore Services</Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="cta-title">
        <div className="container">
          <div className="cta-content">
            <h2 id="cta-title">Have a Similar Challenge?</h2>
            <p>
              Let's discuss your project and explore how we can deliver measurable results for your business.
            </p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Start a Conversation</Link>
              <Link to="/services" className="button secondary large">Explore Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
