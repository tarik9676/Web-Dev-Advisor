import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package, Zap, Shield, Download, CheckCircle, Tag, Star, CreditCard,
  Filter, X, ChevronDown, Loader2
} from 'lucide-react';
import { productsApi } from '../../api/products.js';

const BILLING_LABELS = {
  one_time: 'One-time',
  monthly: 'Monthly',
  yearly: 'Yearly',
  lifetime: 'Lifetime',
};

const LICENSE_LABELS = {
  single: 'Single Site',
  multi: 'Multi-Site (5)',
  unlimited: 'Unlimited Sites',
  developer: 'Developer License',
};

const CATEGORY_ICONS = {
  plugin: Package,
  subscription: CreditCard,
  theme: Shield,
  bundle: Star,
  service: Zap,
};

function CategoryIcon({ type, size = 32 }) {
  const Icon = CATEGORY_ICONS[type] || Package;
  return <Icon size={size} />;
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBilling, setSelectedBilling] = useState('all');
  const [selectedLicense, setSelectedLicense] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes, featuredRes] = await Promise.all([
        productsApi.getAll(),
        productsApi.getCategories(),
        productsApi.getFeatured(),
      ]);
      setProducts(productsRes);
      setCategories(categoriesRes);
      setFeaturedProducts(featuredRes);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    if (selectedCategory !== 'all' && product.category?.slug !== selectedCategory) return false;
    if (selectedBilling !== 'all' && product.billing_type !== selectedBilling) return false;
    if (selectedLicense !== 'all' && product.license_type !== selectedLicense) return false;
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !product.short_description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const hasActiveFilters = selectedCategory !== 'all' || selectedBilling !== 'all' || selectedLicense !== 'all' || searchQuery;

  const clearFilters = () => {
    setSelectedCategory('all');
    setSelectedBilling('all');
    setSelectedLicense('all');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="products-page">
        <div className="products-hero">
          <div className="container">
            <div className="skeleton-lines" style={{maxWidth: '600px'}}>
              <span style={{height: '40px', width: '60%'}} />
              <span style={{height: '20px', width: '80%'}} />
            </div>
          </div>
        </div>
        <div className="container">
          <div className="skeleton-lines">
            <span style={{height: '400px'}} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="products-page">
      {/* Hero Section */}
      <section className="page-hero" aria-labelledby="products-hero-title">
        <div className="hero-background">
          <div className="gradient-orb orb-1" />
          <div className="gradient-orb orb-2" />
          <div className="grid-pattern" />
        </div>
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb-sep" aria-hidden="true">/</span>
            <span aria-current="page">Products</span>
          </nav>
          <h1 id="products-hero-title" className="hero-title">
            Digital Products
            <br />
            <span className="highlight">WordPress Plugins & Apps</span>
          </h1>
          <p className="hero-description">
            Premium WordPress plugins, app subscriptions, and developer tools.
            Built with modern standards, human-owned quality, and AI-accelerated development.
          </p>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="featured-section" aria-labelledby="featured-title">
          <div className="container">
            <header className="section-header">
              <span className="section-badge">Featured</span>
              <h2 id="featured-title">Our Top Picks</h2>
              <p className="section-description">
                Hand-selected products that deliver exceptional value for WooCommerce stores.
              </p>
            </header>
            <div className="products-grid">
              {featuredProducts.map((product, i) => (
                <article key={product.id} className="product-card featured">
                  <Link to={`/products/${product.slug}`} className="product-card-link">
                    <div className="product-thumbnail">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} loading="lazy" />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <CategoryIcon type={product.category?.type} size={32} />
                        </div>
                      )}
                      {product.is_on_sale && (
                        <span className="sale-badge">Sale</span>
                      )}
                      {product.is_featured && (
                        <span className="featured-badge"><Star size={12} /> Featured</span>
                      )}
                    </div>
                    <div className="product-content">
                      {product.category && (
                        <span className="product-category">{product.category.name}</span>
                      )}
                      <h3>{product.name}</h3>
                      <p className="product-short-desc">{product.short_description}</p>
                      <div className="product-meta">
                        <span className="product-billing">
                          <CreditCard size={12} />
                          {BILLING_LABELS[product.billing_type] || product.billing_type}
                        </span>
                        <span className="product-license">
                          <Tag size={12} />
                          {LICENSE_LABELS[product.license_type] || product.license_type}
                        </span>
                      </div>
                      <div className="product-price">
                        {product.is_on_sale && product.sale_price && (
                          <>
                            <span className="sale-price">${product.sale_price}</span>
                            <span className="original-price">${product.price}</span>
                            <span className="period">/{product.billing_type === 'one_time' ? 'once' : product.billing_type}</span>
                          </>
                        )}
                        {!product.is_on_sale && (
                          <>
                            <span className="current-price">${product.current_price}</span>
                            <span className="period">/{product.billing_type === 'one_time' ? 'once' : product.billing_type}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section className="products-section" aria-labelledby="all-products-title">
        <div className="container">
          <header className="section-header">
            <span className="section-badge">All Products</span>
            <h2 id="all-products-title">Browse Our Catalog</h2>
            <p className="section-description">
              Filter by category, billing type, or license to find the perfect solution.
            </p>
          </header>

          {/* Filters */}
          <div className="products-filters">
            <div className="filter-group">
              <label htmlFor="search" className="filter-label">
                <Filter size={14} /> Search
              </label>
              <input
                id="search"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label htmlFor="category" className="filter-label">
                <Tag size={14} /> Category
              </label>
              <select
                id="category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="billing" className="filter-label">
                <CreditCard size={14} /> Billing
              </label>
              <select
                id="billing"
                value={selectedBilling}
                onChange={(e) => setSelectedBilling(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Types</option>
                <option value="one_time">One-time Purchase</option>
                <option value="monthly">Monthly Subscription</option>
                <option value="yearly">Yearly Subscription</option>
                <option value="lifetime">Lifetime Access</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="license" className="filter-label">
                <Shield size={14} /> License
              </label>
              <select
                id="license"
                value={selectedLicense}
                onChange={(e) => setSelectedLicense(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Licenses</option>
                <option value="single">Single Site</option>
                <option value="multi">Multi-Site (5)</option>
                <option value="unlimited">Unlimited Sites</option>
                <option value="developer">Developer License</option>
              </select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="button secondary clear-filters">
                <X size={14} /> Clear Filters
              </button>
            )}
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, i) => (
                <article key={product.id} className="product-card">
                  <Link to={`/products/${product.slug}`} className="product-card-link">
                    <div className="product-thumbnail">
                      {product.thumbnail ? (
                        <img src={product.thumbnail} alt={product.name} loading="lazy" />
                      ) : (
                        <div className="thumbnail-placeholder">
                          <CategoryIcon type={product.category?.type} size={32} />
                        </div>
                      )}
                      {product.is_on_sale && (
                        <span className="sale-badge">Sale</span>
                      )}
                      {product.is_featured && (
                        <span className="featured-badge"><Star size={12} /> Featured</span>
                      )}
                    </div>
                    <div className="product-content">
                      {product.category && (
                        <span className="product-category">{product.category.name}</span>
                      )}
                      <h3>{product.name}</h3>
                      <p className="product-short-desc">{product.short_description}</p>
                      <div className="product-meta">
                        <span className="product-billing">
                          <CreditCard size={12} />
                          {BILLING_LABELS[product.billing_type] || product.billing_type}
                        </span>
                        <span className="product-license">
                          <Tag size={12} />
                          {LICENSE_LABELS[product.license_type] || product.license_type}
                        </span>
                      </div>
                      <div className="product-price">
                        {product.is_on_sale && product.sale_price && (
                          <>
                            <span className="sale-price">${product.sale_price}</span>
                            <span className="original-price">${product.price}</span>
                            <span className="period">/{product.billing_type === 'one_time' ? 'once' : product.billing_type}</span>
                          </>
                        )}
                        {!product.is_on_sale && (
                          <>
                            <span className="current-price">${product.current_price}</span>
                            <span className="period">/{product.billing_type === 'one_time' ? 'once' : product.billing_type}</span>
                          </>
                        )}
                      </div>
                      <div className="product-features">
                        {product.features?.slice(0, 3).map((feature, idx) => (
                          <span key={idx} className="feature-tag">
                            <CheckCircle size={12} /> {feature}
                          </span>
                        ))}
                        {product.features && product.features.length > 3 && (
                          <span className="feature-tag more">+{product.features.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </Link>
                </article>
              ))
            ) : (
              <div className="no-products">
                <Package size={48} />
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="button primary">Clear Filters</button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section" aria-labelledby="cta-title">
        <div className="cta-container">
          <div className="cta-content">
            <h2 id="cta-title">Need a Custom Solution?</h2>
            <p>Can't find what you're looking for? We build custom WordPress plugins and integrations tailored to your exact requirements.</p>
            <div className="cta-actions">
              <Link to="/contact" className="button primary large">Request Custom Development</Link>
              <Link to="/services" className="button secondary large">View Services</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}