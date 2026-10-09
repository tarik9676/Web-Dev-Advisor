import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, User, Key, Eye, EyeOff } from 'lucide-react';
import { clientsApi } from '../../api/clients';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

const EMPTY_CLIENT = {
  name: '',
  email: '',
  company: '',
  phone: '',
  profile_image: '',
  street_address: '',
  city: '',
  postal_code: '',
  country: '',
  billing_address: '',
  credentials: '',
  notes: '',
  username: '',
  password: '',
};

export default function ClientEditPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const activeProject = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [client, setClient] = useState(EMPTY_CLIENT);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showUsernameHint, setShowUsernameHint] = useState(false);

  const handleProjectChange = (event) => {
    const nextId = event.target.value;
    selectProject(nextId);
    loadProject(nextId);
  };

  useEffect(() => {
    if (isNew) {
      setClient({ ...EMPTY_CLIENT });
      setLoading(false);
    } else {
      fetchClient(id);
    }
  }, [id, isNew]);

  const fetchClient = async (clientId) => {
    try {
      const data = await clientsApi.getById(clientId);
      setClient({
        ...EMPTY_CLIENT,
        ...data,
        password: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setClient((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!client.name.trim()) {
      setError('Client name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = { ...client };
    if (!payload.password) {
      delete payload.password;
    }

    try {
      if (isNew) {
        const created = await clientsApi.create(payload);
        navigate(`/app/clients/${created.id}`, { replace: true });
      } else {
        const updated = await clientsApi.update(id, payload);
        setClient((prev) => ({ ...prev, ...updated }));
        navigate(`/app/clients/${id}`, { replace: true });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
    <div className="page client-edit-page">
      <Header project={activeProject} onProjectChange={handleProjectChange} projects={projects} />
      <div className="edit-header">
        <div className="edit-header-left">
          <button className="button secondary" onClick={() => navigate('/app/clients')} type="button">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="eyebrow">Clients / {isNew ? 'New Client' : 'Edit Client'}</span>
          <h1>{isNew ? 'New Client' : client?.name || 'Untitled'}</h1>
        </div>
        <div className="edit-header-right">
          <button className="button primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? <Loader2 size={14} className="spin" /> : <><Save size={14} /> {isNew ? 'Create Client' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ margin: '0 24px 16px' }}>{error}</div>}

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Profile Information</strong>
            <small>Only the name field is required. All other fields are optional.</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label>
              <span>Name <em className="meta-required">*</em></span>
              <input
                type="text"
                value={client.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Acme Corporation"
                autoFocus
              />
            </label>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={client.email}
                onChange={(e) => setField('email', e.target.value)}
                placeholder="contact@acme.com"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="tel"
                value={client.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+1-555-0100"
              />
            </label>
            <label>
              <span>Company</span>
              <input
                type="text"
                value={client.company}
                onChange={(e) => setField('company', e.target.value)}
                placeholder="Acme Inc."
              />
            </label>
            <label className="span-2">
              <span>Profile Image URL</span>
              <input
                type="url"
                value={client.profile_image}
                onChange={(e) => setField('profile_image', e.target.value)}
                placeholder="https://example.com/avatar.png"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Address</strong>
            <small>Street, city, postal code, and country</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label className="span-2">
              <span>Street Address</span>
              <textarea
                rows={2}
                value={client.street_address}
                onChange={(e) => setField('street_address', e.target.value)}
                placeholder="100 Main Street, Suite 500"
              />
            </label>
            <label>
              <span>City</span>
              <input
                type="text"
                value={client.city}
                onChange={(e) => setField('city', e.target.value)}
                placeholder="San Francisco"
              />
            </label>
            <label>
              <span>Postal Code</span>
              <input
                type="text"
                value={client.postal_code}
                onChange={(e) => setField('postal_code', e.target.value)}
                placeholder="94102"
              />
            </label>
            <label>
              <span>Country</span>
              <input
                type="text"
                value={client.country}
                onChange={(e) => setField('country', e.target.value)}
                placeholder="USA"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Billing Address</strong>
            <small>Used for invoices and payment processing</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label className="span-2">
              <span>Billing Address</span>
              <textarea
                rows={3}
                value={client.billing_address}
                onChange={(e) => setField('billing_address', e.target.value)}
                placeholder="100 Main Street, Suite 500\nSan Francisco, CA 94102\nUSA"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Account Credentials</strong>
            <small>Login details for the client portal. Leave password blank to keep current or auto-generate on create.</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label>
              <span>Username</span>
              <div className="input-with-hint">
                <input
                  type="text"
                  value={client.username}
                  onChange={(e) => setField('username', e.target.value)}
                  placeholder={isNew ? 'Auto-generated from name' : client.user_username || 'Current username'}
                  disabled={!isNew && !client.username}
                />
                <button
                  type="button"
                  className="icon-button hint-button"
                  onClick={() => setShowUsernameHint(!showUsernameHint)}
                  aria-label="Toggle username hint"
                >
                  <User size={14} />
                </button>
              </div>
              {showUsernameHint && (
                <p className="field-hint">
                  {isNew
                    ? 'Leave blank to auto-generate a username from the client name.'
                    : 'This is the client\'s login username. Changing it will update their account.'}
                </p>
              )}
            </label>
            <label>
              <span>Password</span>
              <div className="input-with-hint">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={client.password}
                  onChange={(e) => setField('password', e.target.value)}
                  placeholder={isNew ? 'Optional (unusable if blank)' : 'Leave blank to keep current'}
                  autoComplete={isNew ? 'new-password' : 'off'}
                />
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="panel meta-panel">
        <div className="panel-heading">
          <div>
            <strong>Credentials & Notes</strong>
            <small>Internal notes and access credentials for team reference</small>
          </div>
        </div>
        <div className="meta-panel-body">
          <div className="form-grid">
            <label className="span-2">
              <span>Credentials</span>
              <textarea
                rows={3}
                value={client.credentials}
                onChange={(e) => setField('credentials', e.target.value)}
                placeholder="WordPress Admin: user@pass\nStripe Dashboard: user@pass\nHosting: user@pass"
              />
            </label>
            <label className="span-2">
              <span>Notes</span>
              <textarea
                rows={3}
                value={client.notes}
                onChange={(e) => setField('notes', e.target.value)}
                placeholder="Internal notes about this client..."
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}