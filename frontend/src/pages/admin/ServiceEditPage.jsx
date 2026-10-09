import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, Globe, Briefcase, Layout } from 'lucide-react';
import BlockEditor, { countBlocks } from '../../components/BlockEditor';
import ListEntriesField from '../../components/ListEntriesField';
import { servicesApi } from '../../api/products';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';
import { BlockVariableContext } from '../../context/BlockVariableContext.jsx';
import { serviceVariableScope } from '../../lib/serviceVariables.js';

const EMPTY_SERVICE = {
  name: '',
  slug: '',
  short_description: '',
  description: '',
  icon: '',
  timeline: '',
  starting_price: '',
  note: '',
  status: 'draft',
  is_featured: false,
  sort_order: 0,
  features: [],
  deliverables: [],
  tiers: [],
  faqs: [],
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

export default function ServiceEditPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const activeProject = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const { slug } = useParams();
  const navigate = useNavigate();
  const isNew = !slug || slug === 'new';
  const [service, setService] = useState(EMPTY_SERVICE);
  const [blocks, setBlocks] = useState([]);
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
      loadService(slug);
    } else {
      setService({ ...EMPTY_SERVICE });
      setBlocks([]);
      setLoading(false);
    }
  }, [slug, isNew]);

  const loadService = async (serviceSlug) => {
    try {
      const data = await servicesApi.getById(serviceSlug);
      setService({ ...EMPTY_SERVICE, ...data });
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setService(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!service.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!service.slug.trim()) {
      setError('Slug is required');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...service,
      slug: slugify(service.slug),
      blocks,
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.published_at;

    try {
      if (isNew) {
        const created = await servicesApi.create(payload);
        navigate(`/app/admin/services/${created.slug}/edit`, { replace: true });
      } else {
        const updated = await servicesApi.update(service.slug, payload);
        setService(prev => ({ ...prev, ...updated, blocks }));
        setBlocks(Array.isArray(updated.blocks) ? updated.blocks : blocks);
      }
    } catch (err) {
      setError(typeof err === 'string' ? err : JSON.stringify(err, null, 2));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/admin/services');
  };

  const handleView = () => {
    if (!isNew) window.open(`/services/${service.slug}`, '_blank');
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
    <div className="page service-edit-page">
      <Header project={activeProject} onProjectChange={handleProjectChange} projects={projects} />
      <div className="edit-header">
        <div className="edit-header-left">
          <button className="button secondary" onClick={handleCancel} type="button">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="eyebrow">Admin / {isNew ? 'New Service' : 'Edit Service'}</span>
          <h1>{isNew ? 'New Service' : service?.name || 'Untitled'}</h1>
        </div>
        <div className="edit-header-right">
          {!isNew && <button className="button secondary" onClick={handleView} type="button">
            <Globe size={14} /> View Public
          </button>}
          <button className="button primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? <Loader2 size={14} className="spin" /> : <><Save size={14} /> {isNew ? 'Create Service' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ margin: '0 24px 16px' }}>{error}</div>}

      <div className="edit-tabs" role="tablist" aria-label="Service editor sections">
        <button
          type="button"
          role="tab"
          className={`edit-tab${activeTab === 'details' ? ' active' : ''}`}
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          <Briefcase size={14} aria-hidden="true" /> Service Details
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
              <strong>Service Details</strong>
              <small>Catalog metadata used by the public services page and detail page.</small>
            </div>
          </div>
          <div className="meta-panel-body">
            <div className="form-grid">
              <label>
                <span>Name <em className="meta-required">*</em></span>
                <input
                  type="text"
                  value={service.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setService(prev => ({
                      ...prev,
                      name,
                      slug: isNew && prev.slug === slugify(prev.name) ? slugify(name) : prev.slug,
                    }));
                  }}
                  placeholder="Service name"
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  type="text"
                  value={service.slug}
                  onChange={(e) => setField('slug', slugify(e.target.value))}
                  placeholder="service-slug"
                />
              </label>
              <label>
                <span>Status</span>
                <select value={service.status} onChange={(e) => setField('status', e.target.value)}>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label>
                <span>Icon</span>
                <input type="text" value={service.icon} onChange={(e) => setField('icon', e.target.value)} placeholder="lucide icon name" />
              </label>
              <label>
                <span>Timeline</span>
                <input type="text" value={service.timeline} onChange={(e) => setField('timeline', e.target.value)} placeholder="4-6 weeks" />
              </label>
              <label>
                <span>Starting Price</span>
                <input type="text" value={service.starting_price} onChange={(e) => setField('starting_price', e.target.value)} placeholder="$1,500" />
              </label>
              <label className="span-2">
                <span>Short Description</span>
                <textarea
                  rows={2}
                  value={service.short_description}
                  onChange={(e) => setField('short_description', e.target.value)}
                  placeholder="One line shown in listings"
                />
              </label>
              <label className="span-2">
                <span>Description</span>
                <textarea
                  rows={5}
                  value={service.description}
                  onChange={(e) => setField('description', e.target.value)}
                />
              </label>
              <div className="span-2">
                <span className="field-label">Features</span>
                <ListEntriesField
                  value={service.features}
                  onChange={(next) => setField('features', next)}
                  placeholder="e.g. Core Web Vitals audit"
                  addLabel="Add feature"
                  emptyLabel="No features listed yet."
                />
              </div>
              <div className="span-2">
                <span className="field-label">Deliverables</span>
                <ListEntriesField
                  value={service.deliverables}
                  onChange={(next) => setField('deliverables', next)}
                  placeholder="e.g. Prioritized issue list"
                  addLabel="Add deliverable"
                  emptyLabel="No deliverables listed yet."
                />
              </div>
              <label className="span-2">
                <span>Note</span>
                <textarea rows={3} value={service.note} onChange={(e) => setField('note', e.target.value)} />
              </label>
              <label>
                <span>Sort Order</span>
                <input type="number" value={service.sort_order} onChange={(e) => setField('sort_order', Number(e.target.value) || 0)} />
              </label>
              <div className="check-grid">
                <label className="check-row">
                  <input type="checkbox" checked={Boolean(service.is_featured)} onChange={(e) => setField('is_featured', e.target.checked)} />
                  <span>Featured</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'canvas' && (
        <div className="canvas-tab-panel">
          <BlockVariableContext.Provider value={serviceVariableScope(service)}>
            <BlockEditor
              blocks={blocks}
              onChange={setBlocks}
              emptyMessage="Add blocks to build your service page"
            />
          </BlockVariableContext.Provider>
        </div>
      )}
    </div>
  );
}