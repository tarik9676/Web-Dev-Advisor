import { Link, Outlet, useLocation } from 'react-router-dom';
import { Menu, X, Briefcase, CheckCircle, ArrowRight, Globe, Mail, Phone, MapPin, Linkedin, Twitter, Github, LayoutGrid, LogOut, UserPlus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_LINKS = [
  { href: '/services', label: 'Services' },
  { href: '/products', label: 'Products' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/case-studies', label: 'Case Studies' },
  { href: '/contact', label: 'Contact' },
];

const FOOTER_LINKS = {
  Company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Blog', href: '/blog' },
    { label: 'Press', href: '/press' },
  ],
  Services: [
    { label: 'WooCommerce Development', href: '/services#woocommerce' },
    { label: 'Custom Plugin Development', href: '/services#plugins' },
    { label: 'Performance Optimization', href: '/services#performance' },
    { label: 'Security & Compliance', href: '/services#security' },
    { label: 'Maintenance & Support', href: '/services#maintenance' },
  ],
  Products: [
    { label: 'WordPress Plugins', href: '/products?category=plugin' },
    { label: 'App Subscriptions', href: '/products?category=subscription' },
    { label: 'Themes', href: '/products?category=theme' },
    { label: 'Bundles', href: '/products?category=bundle' },
  ],
  Resources: [
    { label: 'Documentation', href: '/docs' },
    { label: 'API Reference', href: '/api-docs' },
    { label: 'Community', href: '/community' },
    { label: 'Status', href: '/status' },
  ],
  Legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};

const SOCIAL_LINKS = [
  { icon: Twitter, href: 'https://twitter.com', label: 'Twitter' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com', label: 'GitHub' },
];

export default function PublicLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { audience } = useApp();
  const { isAuthenticated, user, checking, signOut } = useAuth();

  // Landing pages are canvas-driven sales pages, so they opt out of the standard
  // 1200px content measure and run full width.
  const isFullBleed = /^\/(p|s)\/[^/]+\/?$/.test(location.pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <div className="public-layout">
      <header className={`public-header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-container">
          <Link to="/" className="logo" aria-label="Web Dev Advisor Home">
            <span className="logo-mark">WDA</span>
            <span className="logo-text">Web Dev Advisor</span>
          </Link>

          <nav className="main-nav" aria-label="Main navigation">
            <div className="nav-links">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} to={link.href} className="nav-link">
                  {link.label}
                </Link>
              ))}
            </div>
            <div className="nav-actions">
              {checking ? null : isAuthenticated ? (
                <>
                  <Link to="/app/dashboard" className="button secondary">
                    <LayoutGrid size={13} /> Dashboard
                  </Link>
                  <button type="button" className="button secondary" onClick={() => signOut()}>
                    <LogOut size={13} /> Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="button secondary">Sign in</Link>
                  <Link to="/signup" className="button primary">Create account</Link>
                </>
              )}
            </div>
          </nav>

          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-menu" role="navigation" aria-label="Mobile menu">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} to={link.href} className="mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mobile-nav-actions">
              {checking ? null : isAuthenticated ? (
                <>
                  <Link to="/app/dashboard" className="button secondary">
                    <LayoutGrid size={13} /> Dashboard
                  </Link>
                  <button type="button" className="button secondary" onClick={() => signOut()}>
                    <LogOut size={13} /> Sign out{user?.full_name ? ` (${user.full_name})` : ''}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="button secondary">Sign in</Link>
                  <Link to="/signup" className="button primary"><UserPlus size={13} /> Create account</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className={`public-main${isFullBleed ? ' is-full-bleed' : ''}`}><Outlet /></main>

      <footer className="public-footer" role="contentinfo">
        <div className="footer-container">
          <div className="footer-brand">
            <Link to="/" className="footer-logo" aria-label="Web Dev Advisor Home">
              <span className="logo-mark">WDA</span>
              <span className="logo-text">Web Dev Advisor</span>
            </Link>
            <p className="footer-tagline">Expert WooCommerce development & AI-accelerated delivery for ambitious e-commerce brands.</p>
            <div className="social-links">
              {SOCIAL_LINKS.map((social) => (
                <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.label} className="social-link">
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category} className="footer-column">
                <h4>{category}</h4>
                <ul>
                  {links.map((link) => (
                    <li key={link.href}>
                      <Link to={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Web Dev Advisor. All rights reserved.</p>
          <p className="footer-legal">
            <Link to="/privacy">Privacy Policy</Link> · <Link to="/terms">Terms of Service</Link> · <Link to="/cookies">Cookie Policy</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}