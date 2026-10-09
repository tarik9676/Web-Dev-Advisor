import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, Globe, Package, Layout } from 'lucide-react';
import BlockEditor, { countBlocks } from '../../components/BlockEditor';
import { BlockVariableContext } from '../../context/BlockVariableContext.jsx';
import { productVariableScope } from '../../lib/productVariables.js';
import ListEntriesField from '../../components/ListEntriesField';
import { productsApi } from '../../api/products';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

// Newline-delimited TextField <-> string[] for the list editor.
function toLines(text) {
  return String(text || '').split('\n');
}

const EMPTY_PRODUCT = {
  name: '',
  slug: '',
  category_slug: '',
  short_description: '',
  description: '',
  version: '1.0.0',
  license_type: 'single',
  billing_type: 'one_time',
  price: '',
  sale_price: '',
  currency: 'USD',
  status: 'draft',
  is_featured: false,
  thumbnail: '',
  tags: [],
  features: [],
  documentation_url: '',
  demo_url: '',
  requirements: '',
  changelog: '',
  download_limit: 0,
  download_expiry_days: 365,
  sort_order: 0,
  blocks: [],
};

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProductEditPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const activeProject = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug || slug === 'new';
  const [product, setProduct] = useState(EMPTY_PRODUCT);
  const [blocks, setBlocks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  useEffect(() => {
    if (!isNew) {
      loadProduct(slug);
    } else {
      setProduct({ ...EMPTY_PRODUCT });
      setBlocks([]);
      setLoading(false);
    }
  }, [slug, isNew]);

  useEffect(() => {
    productsApi.getCategories()
      .then(setCategories)
      .catch(() => setCategories([]));
  }, []);

  const loadProduct = async (productSlug) => {
    try {
      const data = await productsApi.getById(productSlug);
      setProduct({ ...EMPTY_PRODUCT, ...data, category_slug: data.category?.slug || '' });
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setProduct(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!product.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!product.slug.trim()) {
      setError('Slug is required');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...product,
      slug: slugify(product.slug),
      category_slug: product.category_slug || null,
      price: product.price === '' ? '0' : String(product.price),
      sale_price: product.sale_price === '' ? null : String(product.sale_price),
      blocks,
    };
    delete payload.id;
    delete payload.category;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.published_at;
    delete payload.current_price;
    delete payload.is_on_sale;
    delete payload.related_products;

    try {
      if (isNew) {
        const created = await productsApi.create(payload);
        navigate(`/app/admin/products/${created.slug}/edit`, { replace: true });
      } else {
        const updated = await productsApi.update(product.slug, payload);
        setProduct(prev => ({ ...prev, ...updated, blocks }));
        setBlocks(Array.isArray(updated.blocks) ? updated.blocks : blocks);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : JSON.stringify(err, null, 2));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/admin/products');
  };

  const handleView = () => {
    if (!isNew) window.open(`/products/${product.slug}`, '_blank');
  };

  if (loading) {
    return (
      <div className="page" style={{ padding: '24px' }}>
        <div className="skeleton-lines">
          <span style={{ height: '600px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="page product-edit-page">
      <Header project={activeProject} onProjectChange={handleProjectChange} projects={projects} />
      <div className="edit-header">
        <div className="edit-header-left">
          <button className="button secondary" onClick={handleCancel} type="button">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="eyebrow">Admin / {isNew ? 'New Product' : 'Edit Product'}</span>
          <h1>{isNew ? 'New Product' : product?.name || 'Untitled'}</h1>
        </div>
        <div className="edit-header-right">
          {!isNew && <button className="button secondary" onClick={handleView} type="button">
            <Globe size={14} /> View Public
          </button>}
          <button className="button primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? <Loader2 size={14} className="spin" /> : <><Save size={14} /> {isNew ? 'Create Product' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ margin: '0 24px 16px' }}>{error}</div>}

      <div className="edit-tabs" role="tablist" aria-label="Product editor sections">
        <button
          type="button"
          role="tab"
          className={`edit-tab${activeTab === 'details' ? ' active' : ''}`}
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          <Package size={14} aria-hidden="true" /> Product Details
        </button>
        <button
          type="button"
          role="tab"
          className={`edit-tab${activeTab === 'canvas' ? ' active' : ''}`}
          aria-selected={activeTab === 'canvas'}
          onClick={() => setActiveTab('canvas')}
        >
          <Layout size={14} aria-hidden="true" /> Canvas
          {countBlocks(blocks) > 0 && (
            <span className="edit-tab-count">{countBlocks(blocks)}</span>
          )}
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="panel meta-panel">
          <div className="panel-heading">
            <div>
              <strong>Product Details</strong>
              <small>Catalog metadata used by the public products page and checkout.</small>
            </div>
          </div>
          <div className="meta-panel-body">
            <div className="form-grid">
              <label>
                <span>Name <em className="meta-required">*</em></span>
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setProduct(prev => ({
                      ...prev,
                      name,
                      slug: isNew && prev.slug === slugify(prev.name) ? slugify(name) : prev.slug,
                    }));
                  }}
                  placeholder="Product name"
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  type="text"
                  value={product.slug}
                  onChange={(e) => setField('slug', slugify(e.target.value))}
                  placeholder="product-slug"
                />
              </label>
              <label>
                <span>Category</span>
                <select value={product.category_slug || ''} onChange={(e) => setField('category_slug', e.target.value)}>
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={product.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
<label className="span-2">
                    <span>Short Description</span>
                    <textarea
                      rows={2}
                      value={product.short_description}
                      onChange={(e) => setField('short_description', e.target.value)}
                      placeholder="One line shown in listings"
                    />
                  </label>
                  <label className="span-2">
                    <span>Description</span>
                    <textarea
                      rows={6}
                      value={product.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="Overview copy shown on the product Overview tab"
                    />
                  </label>
                  <label>
                    <span>Price</span>
                <input type="number" step="0.01" min="0" value={product.price} onChange={(e) => setField('price', e.target.value)} />
              </label>
              <label>
                <span>Sale Price</span>
                <input type="number" step="0.01" min="0" value={product.sale_price} onChange={(e) => setField('sale_price', e.target.value)} placeholder="— none —" />
              </label>
              <label>
                <span>Billing</span>
                <select value={product.billing_type} onChange={(e) => setField('billing_type', e.target.value)}>
                  <option value="one_time">One-time Purchase</option>
                  <option value="monthly">Monthly Subscription</option>
                  <option value="yearly">Yearly Subscription</option>
                  <option value="lifetime">Lifetime Access</option>
                </select>
              </label>
              <label>
                <span>License Type</span>
                <select value={product.license_type} onChange={(e) => setField('license_type', e.target.value)}>
                  <option value="single">Single Site</option>
                  <option value="multi">Multi-Site (5)</option>
                  <option value="unlimited">Unlimited Sites</option>
                  <option value="developer">Developer License</option>
                </select>
              </label>
              <label>
                <span>Version</span>
                <input type="text" value={product.version} onChange={(e) => setField('version', e.target.value)} />
              </label>
              <label>
                <span>Currency</span>
                <input type="text" maxLength={3} value={product.currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())} />
              </label>
              <label className="span-2">
                <span>Thumbnail URL</span>
                <input type="url" value={product.thumbnail} onChange={(e) => setField('thumbnail', e.target.value)} placeholder="https://" />
              </label>
              <label>
                <span>Documentation URL</span>
                <input type="url" value={product.documentation_url} onChange={(e) => setField('documentation_url', e.target.value)} placeholder="https://" />
              </label>
              <label>
                <span>Demo URL</span>
                <input type="url" value={product.demo_url} onChange={(e) => setField('demo_url', e.target.value)} placeholder="https://" />
              </label>
              <label>
                <span>Download Limit</span>
                <input type="number" min="0" value={product.download_limit} onChange={(e) => setField('download_limit', Number(e.target.value) || 0)} />
              </label>
              <label>
                <span>Download Expiry (days)</span>
                <input type="number" min="0" value={product.download_expiry_days} onChange={(e) => setField('download_expiry_days', Number(e.target.value) || 0)} />
              </label>
              <label>
                <span>Sort Order</span>
                <input type="number" value={product.sort_order} onChange={(e) => setField('sort_order', Number(e.target.value) || 0)} />
              </label>
              <div className="span-2 check-grid">
                <label className="check-row">
                  <input type="checkbox" checked={Boolean(product.is_featured)} onChange={(e) => setField('is_featured', e.target.checked)} />
                  <span>Featured</span>
                </label>
              </div>
              <div className="span-2">
                <span className="field-label">Features</span>
                <ListEntriesField
                  value={product.features}
                  onChange={(next) => setField('features', next)}
                  placeholder="e.g. Unlimited projects"
                  addLabel="Add feature"
                  emptyLabel="No features listed yet."
                />
              </div>
              <div className="span-2">
                <span className="field-label">Tags</span>
                <ListEntriesField
                  value={product.tags}
                  onChange={(next) => setField('tags', next)}
                  placeholder="e.g. wordpress"
                  addLabel="Add tag"
                  emptyLabel="No tags yet."
                />
              </div>
              <label>
                <span>Requirements</span>
                <textarea rows={3} value={product.requirements} onChange={(e) => setField('requirements', e.target.value)} />
              </label>
              <div className="span-2">
                <span className="field-label">Changelog</span>
                <ListEntriesField
                  value={toLines(product.changelog)}
                  onChange={(next) => setField('changelog', next.join('\n'))}
                  placeholder="e.g. 1.2.0 — added dark mode"
                  addLabel="Add entry"
                  emptyLabel="No changelog entries yet."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canvas' && (
        <div className="canvas-tab-panel">
          <BlockVariableContext.Provider value={productVariableScope(product)}>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              emptyMessage="Add blocks to build your landing page"
            />
          </BlockVariableContext.Provider>
        </div>
      )}
    </div>
  );
}