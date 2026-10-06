import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Package, Shield, Download, CheckCircle, Tag, Star, CreditCard,
  ArrowLeft, Clock, Globe, FileCode, Users, RefreshCw, ExternalLink,
  Loader2, AlertCircle, X, Mail, Lock, ArrowRight
} from 'lucide-react';
import { productsApi } from '../../api/products.js';

const BILLING_LABELS = {
  one_time: 'One-time Purchase',
  monthly: 'Monthly Subscription',
  yearly: 'Yearly Subscription',
  lifetime: 'Lifetime Access',
};

const LICENSE_LABELS = {
  single: 'Single Site License',
  multi: 'Multi-Site License (5 sites)',
  unlimited: 'Unlimited Sites License',
  developer: 'Developer License',
};

const LICENSE_PRICE_MODIFIERS = {
  single: 1,
  multi: 2.5,
  unlimited: 5,
  developer: 3,
};

const CATEGORY_ICONS = {
  plugin: Package,
  subscription: CreditCard,
  theme: Shield,
  bundle: Star,
  service: Globe,
};

export default function ProductDetail() {
  const { productSlug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState('single');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState(null);
  const [formData, setFormData] = useState({ email: '', name: '' });

  useEffect(() => {
    loadProduct();
  }, [productSlug]);

  const loadProduct = async () => {
    try {
      const data = await productsApi.getById(productSlug);
      setProduct(data);
    } catch (err) {
      setError('Failed to load product');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Builder-authored page content, shown as an extra tab when present.
  const hasBlocks = Boolean(product?.blocks && product.blocks.length > 0);

  const calculatePrice = () => {
    if (!product) return 0;
    const basePrice = product.is_on_sale && product.sale_price ? product.sale_price : product.current_price;
    const modifier = LICENSE_PRICE_MODIFIERS[selectedLicense] || 1;
    return basePrice * modifier;
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (!formData.email) {
      setCheckoutError('Email is required');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const response = await productsApi.checkout({
        product_id: product.id,
        email: formData.email,
        name: formData.name,
        license_type: selectedLicense,
        success_url: window.location.origin + `/products/${product.slug}?success=true`,
        cancel_url: window.location.origin + `/products/${product.slug}?canceled=true`,
      });

      if (response.checkout_url) {
        window.location.href = response.checkout_url;
      }
    } catch (err) {
      setCheckoutError(err.message || 'Checkout failed. Please try again.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const openCheckout = (license = 'single') => {
    setSelectedLicense(license);
    setShowCheckoutModal(true);
    setCheckoutError(null);
    setFormData({ email: '', name: '' });
  };

  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="skeleton-lines">
            <span style={{height: '300px'}} />
            <span style={{height: '400px'}} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-detail-page">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={48} />
            <h2>Product Not Found</h2>
            <p>The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products" className="button primary">Browse All Products</Link>
          </div>
        </div>
      </div>
    );
  }

  const CategoryIcon = CATEGORY_ICONS[product.category?.type] || Package;

  return (
    <div className="product-detail-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb-bar" aria-label="Breadcrumb">
        <div className="container">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          <Link to="/products" className="breadcrumb-link">Products</Link>
          <span className="breadcrumb-sep" aria-hidden="true">/</span>
          {product.category && (
            <>
              <Link to={`/products?category=${product.category.slug}`} className="breadcrumb-link">
                {product.category.name}
              </Link>
              <span className="breadcrumb-sep" aria-hidden="true">/</span>
            </>
          )}
          <span className="breadcrumb-current" aria-current="page">{product.name}</span>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="product-hero" aria-labelledby="product-title">
        <div className="container">
          <div className="product-hero-grid">
            <div className="product-gallery">
              <div className="main-image">
                {product.thumbnail ? (
                  <img src={product.thumbnail} alt={product.name} />
                ) : (
                  <div className="image-placeholder">
                    <CategoryIcon size={64} />
                  </div>
                )}
              </div>
              {product.gallery && product.gallery.length > 0 && (
                <div className="thumbnails">
                  {product.gallery.map((img, i) => (
                    <button key={i} className="thumbnail-btn" aria-label={`View image ${i + 1}`}>
                      <img src={img} alt={`${product.name} - Image ${i + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="product-info">
              <div className="product-header">
                {product.category && (
                  <Link to={`/products?category=${product.category.slug}`} className="product-category-link">
                    <CategoryIcon size={16} />
                    {product.category.name}
                  </Link>
                )}
                <h1 id="product-title">{product.name}</h1>
                <p className="product-tagline">{product.short_description}</p>
                {hasBlocks && (
                  <Link to={`/p/${product.slug}`} className="product-landing-link">
                    View sales page
                    <ArrowRight size={15} />
                  </Link>
                )}
              </div>

              <div className="product-meta-bar">
                <div className="meta-item">
                  <CreditCard size={16} />
                  <span>{BILLING_LABELS[product.billing_type] || product.billing_type}</span>
                </div>
                <div className="meta-item">
                  <Tag size={16} />
                  <span>{LICENSE_LABELS[product.license_type] || product.license_type}</span>
                </div>
                <div className="meta-item">
                  <RefreshCw size={16} />
                  <span>Version {product.version}</span>
                </div>
              </div>

              <div className="product-price-section">
                {product.is_on_sale && product.sale_price && (
                  <>
                    <div className="price-row sale">
                      <span className="sale-price">${product.sale_price}</span>
                      <span className="original-price">${product.price}</span>
                    </div>
                    {product.sale_ends_at && (
                      <p className="sale-ends">
                        <Clock size={14} />
                        Sale ends {new Date(product.sale_ends_at).toLocaleDateString()}
                      </p>
                    )}
                  </>
                )}
                {!product.is_on_sale && (
                  <div className="price-row">
                    <span className="current-price">${product.current_price}</span>
                    <span className="period">/{product.billing_type === 'one_time' ? 'one-time' : product.billing_type}</span>
                  </div>
                )}
              </div>

              <div className="product-actions">
                <button
                  onClick={() => openCheckout('single')}
                  className="button primary large buy-button"
                >
                  <Download size={20} />
                  {product.billing_type === 'one_time' ? 'Buy Now' : 'Subscribe Now'}
                </button>
                {product.demo_url && (
                  <Link to={product.demo_url} target="_blank" rel="noopener noreferrer" className="button secondary large demo-button">
                    <ExternalLink size={20} />
                    Live Demo
                  </Link>
                )}
              </div>

              <div className="product-guarantees">
                <div className="guarantee">
                  <Shield size={18} />
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="guarantee">
                  <RefreshCw size={18} />
                  <span>1 year of updates included</span>
                </div>
                <div className="guarantee">
                  <Users size={18} />
                  <span>Priority support included</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section */}
      <section className="product-tabs-section">
        <div className="container">
          <div className="tabs-nav" role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              className={activeTab === 'overview' ? 'active' : ''}
            >
              Overview
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'features'}
              onClick={() => setActiveTab('features')}
              className={activeTab === 'features' ? 'active' : ''}
            >
              Features
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'changelog'}
              onClick={() => setActiveTab('changelog')}
              className={activeTab === 'changelog' ? 'active' : ''}
            >
              Changelog
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'requirements'}
              onClick={() => setActiveTab('requirements')}
              className={activeTab === 'requirements' ? 'active' : ''}
            >
              Requirements
            </button>
          </div>

          <div className="tabs-content" role="tabpanel">
            {activeTab === 'overview' && (
              <div className="tab-panel">
                <div className="overview-content">
                  {product.description && (
                    <div className="overview-section">
                      <h3>Description</h3>
                      <div className="description-content">{product.description}</div>
                    </div>
                  )}
                  {product.tags && product.tags.length > 0 && (
                    <div className="overview-section">
                      <h3>Tags</h3>
                      <div className="tags-list">
                        {product.tags.map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {product.documentation_url && (
                    <div className="overview-section">
                      <Link to={product.documentation_url} target="_blank" rel="noopener noreferrer" className="button secondary">
                        <FileCode size={16} /> View Documentation
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'features' && (
              <div className="tab-panel">
                <div className="features-list">
                  {product.features && product.features.length > 0 ? (
                    product.features.map((feature, i) => (
                      <div key={i} className="feature-item">
                        <CheckCircle size={20} />
                        <span>{feature}</span>
                      </div>
                    ))
                  ) : (
                    <p className="no-features">No features listed yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'changelog' && (
              <div className="tab-panel">
                <div className="changelog-content">
                  {product.changelog ? (
                    <pre className="changelog-text">{product.changelog}</pre>
                  ) : (
                    <p className="no-changelog">No changelog available yet.</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="tab-panel">
                <div className="requirements-content">
                  {product.requirements ? (
                    <pre className="requirements-text">{product.requirements}</pre>
                  ) : (
                    <p className="no-requirements">No specific requirements listed.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Related Products */}
      {product.related_products && product.related_products.length > 0 && (
        <section className="related-section" aria-labelledby="related-title">
          <div className="container">
            <header className="section-header">
              <span className="section-badge">You May Also Like</span>
              <h2 id="related-title">Related Products</h2>
            </header>
            <div className="products-grid">
              {product.related_products.map((related, i) => (
                <article key={related.id} className="product-card">
                  <Link to={`/products/${related.slug}`} className="product-card-link">
                    <div className="product-thumbnail">
                      {related.thumbnail ? (
                        <img src={related.thumbnail} alt={related.name} loading="lazy" />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <CategoryIcon type={related.category?.type} size={32} />
                        </div>
                      )}
                      {related.is_on_sale && <span className="sale-badge">Sale</span>}
                    </div>
                    <div className="product-content">
                      {related.category && <span className="product-category">{related.category.name}</span>}
                      <h3>{related.name}</h3>
                      <div className="product-price">
                        {related.is_on_sale && related.sale_price ? (
                          <>
                            <span className="sale-price">${related.sale_price}</span>
                            <span className="original-price">${related.price}</span>
                          </>
                        ) : (
                          <span className="current-price">${related.current_price}</span>
                        )}
                        <span className="period">/{related.billing_type === 'one_time' ? 'once' : related.billing_type}</span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-container">
          <div className="cta-content">
            <h2 id="cta-title">Ready to Get Started?</h2>
            <p>Join thousands of developers and store owners who trust our products.</p>
            <div className="cta-actions">
              <button onClick={() => openCheckout('single')} className="button primary large">
                <Download size={20} />
                {product.billing_type === 'one_time' ? 'Buy Now' : 'Subscribe Now'}
              </button>
              <Link to="/contact" className="button secondary large">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Checkout Modal */}
      {showCheckoutModal && (
        <div className="modal-backdrop" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{maxWidth: '480px'}}>
            <div className="modal-header">
              <h3>Complete Your Purchase</h3>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="icon-button"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="checkout-summary">
                <div className="product-summary">
                  <h4>{product.name}</h4>
                  <p className="license-type">{LICENSE_LABELS[selectedLicense] || selectedLicense}</p>
                  <div className="checkout-price">
                    ${calculatePrice().toFixed(2)}
                    <span className="period">/{product.billing_type === 'one_time' ? 'one-time' : product.billing_type}</span>
                  </div>
                </div>
              </div>

              {checkoutError && (
                <div className="checkout-error">
                  <AlertCircle size={16} />
                  {checkoutError}
                </div>
              )}

              <form onSubmit={handleCheckout} className="checkout-form">
                <div className="form-group">
                  <label htmlFor="checkout-email">
                    <Mail size={14} /> Email Address
                  </label>
                  <input
                    id="checkout-email"
                    type="email"
                    required
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={checkoutLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="checkout-name">
                    <Lock size={14} /> Name (Optional)
                  </label>
                  <input
                    id="checkout-name"
                    type="text"
                    placeholder="Your Name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={checkoutLoading}
                  />
                </div>
                <button
                  type="submit"
                  className="button primary full-width"
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 size={18} className="spinning" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Proceed to Checkout
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <p className="checkout-note">
                <Lock size={14} /> Secure checkout powered by Stripe. You'll be redirected to complete payment.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}