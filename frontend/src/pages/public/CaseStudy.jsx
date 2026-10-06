import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, TrendingUp } from 'lucide-react';
import CASE_STUDIES from '../../data/caseStudies.js';
import ErrorState from '../../components/ErrorState.jsx';

export default function CaseStudy() {
  const { caseStudyId } = useParams();
  const navigate = useNavigate();
  const study = CASE_STUDIES.find((item) => item.id === caseStudyId);

  if (!study) {
    return (
      <div className="case-study-page">
        <section className="page-hero">
          <div className="container">
            <nav className="breadcrumb" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              <span className="breadcrumb-sep" aria-hidden="true">/</span>
              <Link to="/case-studies">Case Studies</Link>
            </nav>
            <div className="state-panel">
              <ErrorState message="Case study not found." />
            </div>
            <div className="case-cta">
              <Link to="/case-studies" className="button secondary">
                <ArrowLeft size={14} /> Back to Case Studies
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="case-study-page">
      <section className="page-hero" aria-labelledby="case-study-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <Link to="/case-studies">Case Studies</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Case Study</span>
          </nav>
          <h1 id="case-study-title">{study.title}</h1>
          <p className="hero-description">{study.challenge}</p>
        </div>
      </section>

      <section className="detailed-case-study" id={study.id}>
        <div className="container">
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
                <h3>The Challenge</h3>
                <p>{study.challenge}</p>
              </section>
              <section className="detailed-section">
                <h3>Our Approach</h3>
                <ul className="approach-list">
                  {study.solution.map((item, idx) => (
                    <li key={idx}>
                      <CheckCircle size={16} /> {item}
                    </li>
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
            <Link to="/case-studies" className="button secondary">Back to All Case Studies</Link>
          </div>
        </div>
      </section>

      <section className="cta-section" aria-labelledby="case-cta-title">
        <div className="container">
          <div className="cta-content">
            <h2 id="case-cta-title">Have a Similar Challenge?</h2>
            <p>Let's discuss your project and explore how we can deliver measurable results for your business.</p>
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
