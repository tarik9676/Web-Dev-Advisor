import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Edit, Mail, Phone, MapPin, User, Building2, Key, Calendar, ExternalLink } from 'lucide-react';
import { clientsApi } from '../../api/clients';
import { projectsApi } from '../../api/projects';
import { formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

export default function ClientProfilePage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const activeProject = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [clientProjects, setClientProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleProjectChange = (event) => {
    const nextId = event.target.value;
    selectProject(nextId);
    loadProject(nextId);
  };

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const [clientData, projectsData] = await Promise.all([
          clientsApi.getById(id),
          projectsApi.getAll({}),
        ]);
        setClient(clientData);
        setClientProjects(projectsData.filter((p) => String(p.client_id) === String(id)));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [id]);

  const getInitials = (name) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '—';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const formatAddress = (client) => {
    const parts = [];
    if (client.street_address) parts.push(client.street_address);
    const cityParts = [client.city, client.postal_code].filter(Boolean);
    if (cityParts.length) parts.push(cityParts.join(' '));
    if (client.country) parts.push(client.country);
    return parts.join('\n');
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

  if (error || !client) {
    return (
      <div className="page">
        <Header project={activeProject} onProjectChange={handleProjectChange} projects={projects} />
        <div className="panel" style={{ maxWidth: '600px', margin: '24px auto', textAlign: 'center' }}>
          <div className="panel-heading">
            <strong>Client not found</strong>
          </div>
          <div className="meta-panel-body">
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
              {error || 'The client you are looking for does not exist.'}
            </p>
            <Link to="/app/clients" className="button primary">
              <ArrowLeft size={14} /> Back to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasAddress = client.street_address || client.city || client.postal_code || client.country;

  return (
    <div className="page client-profile-page">
      <Header project={activeProject} onProjectChange={handleProjectChange} projects={projects} />
      <div className="edit-header">
        <div className="edit-header-left">
          <Link to="/app/clients" className="button secondary" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back
          </Link>
          <span className="eyebrow">Clients</span>
          <h1>{client.name}</h1>
        </div>
        <div className="edit-header-right">
          <Link to={`/app/clients/${id}/edit`} className="button primary" style={{ textDecoration: 'none' }}>
            <Edit size={14} /> Edit Client
          </Link>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ margin: '0 24px 16px' }}>{error}</div>}

      <div className="profile-layout">
        <div className="profile-main">
          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Profile</strong>
                <small>Core identity and contact information</small>
              </div>
            </div>
            <div className="meta-panel-body profile-header">
              <div className="profile-avatar-section">
                <div className="profile-avatar">
                  {client.profile_image ? (
                    <img
                      src={client.profile_image}
                      alt={client.name}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    getInitials(client.name)
                  )}
                </div>
                <div className="profile-name-group">
                  <h2>{client.name}</h2>
                  {client.company && (
                    <p className="profile-company">
                      <Building2 size={14} aria-hidden="true" /> {client.company}
                    </p>
                  )}
                  <p className="profile-meta">
                    <Calendar size={14} aria-hidden="true" /> Client since {formatDate(client.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Contact</strong>
                <small>Phone, email, and location</small>
              </div>
            </div>
            <div className="meta-panel-body profile-detail-grid">
              <div className="detail-item">
                <Mail size={16} className="detail-icon" aria-hidden="true" />
                <div className="detail-content">
                  <span className="detail-label">Email</span>
                  {client.email ? (
                    <a href={`mailto:${client.email}`} className="detail-value">{client.email}</a>
                  ) : (
                    <span className="detail-value empty">—</span>
                  )}
                </div>
              </div>
              <div className="detail-item">
                <Phone size={16} className="detail-icon" aria-hidden="true" />
                <div className="detail-content">
                  <span className="detail-label">Phone</span>
                  {client.phone ? (
                    <a href={`tel:${client.phone}`} className="detail-value">{client.phone}</a>
                  ) : (
                    <span className="detail-value empty">—</span>
                  )}
                </div>
              </div>
              {hasAddress && (
                <div className="detail-item span-2">
                  <MapPin size={16} className="detail-icon" aria-hidden="true" />
                  <div className="detail-content">
                    <span className="detail-label">Address</span>
                    <address className="detail-value address">{formatAddress(client)}</address>
                  </div>
                </div>
              )}
            </div>
          </div>

          {client.billing_address && (
            <div className="panel meta-panel">
              <div className="panel-heading">
                <div>
                  <strong>Billing Address</strong>
                  <small>Used for invoices and payment processing</small>
                </div>
              </div>
              <div className="meta-panel-body">
                <address className="billing-address">{client.billing_address}</address>
              </div>
            </div>
          )}

          {(client.credentials || client.notes) && (
            <div className="panel meta-panel">
              <div className="panel-heading">
                <div>
                  <strong>Additional Information</strong>
                </div>
              </div>
              <div className="meta-panel-body profile-detail-grid">
                {client.credentials && (
                  <div className="detail-item span-2">
                    <Key size={16} className="detail-icon" aria-hidden="true" />
                    <div className="detail-content">
                      <span className="detail-label">Credentials</span>
                      <pre className="detail-value credentials">{client.credentials}</pre>
                    </div>
                  </div>
                )}
                {client.notes && (
                  <div className="detail-item span-2">
                    <span className="detail-icon" style={{ opacity: 0 }} aria-hidden="true" />
                    <div className="detail-content">
                      <span className="detail-label">Notes</span>
                      <p className="detail-value">{client.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {clientProjects.length > 0 && (
            <div className="panel meta-panel">
              <div className="panel-heading">
                <div>
                  <strong>Projects</strong>
                  <small>{clientProjects.length} project{clientProjects.length !== 1 ? 's' : ''} linked to this client</small>
                </div>
              </div>
              <div className="meta-panel-body">
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Project</th>
                        <th>Status</th>
                        <th>Deadline</th>
                        <th style={{ width: '80px' }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientProjects.map((project) => (
                        <tr key={project.id}>
                          <td>
                            <strong>{project.project_name}</strong>
                            <br />
                            <small>{project.slug}</small>
                          </td>
                          <td>
                            <span className={`status-badge ${project.status === 'active' ? '' : project.status === 'planning' ? 'draft' : 'archived'}`}>
                              {project.status}
                            </span>
                          </td>
                          <td>{project.deadline || '—'}</td>
                          <td>
                            <Link to={`/app/dashboard?project=${project.id}`} className="button secondary small" style={{ textDecoration: 'none' }}>
                              <ExternalLink size={12} /> Open
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="profile-sidebar">
          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Account Access</strong>
                <small>Login credentials for client portal</small>
              </div>
            </div>
            <div className="meta-panel-body">
              <div className="detail-item">
                <User size={16} className="detail-icon" aria-hidden="true" />
                <div className="detail-content">
                  <span className="detail-label">Username</span>
                  <span className="detail-value mono">{client.user_username || '—'}</span>
                </div>
              </div>
              <div className="detail-item">
                <Calendar size={16} className="detail-icon" aria-hidden="true" />
                <div className="detail-content">
                  <span className="detail-label">Account Created</span>
                  <span className="detail-value">{client.user_username ? formatDate(client.created_at) : 'Not linked'}</span>
                </div>
              </div>
              {client.user_id && (
                <div className="detail-item">
                  <span className="detail-label">Account Status</span>
                  <span className="detail-value status-active">
                    <span className="status-dot green" aria-hidden="true" />
                    Active
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Quick Stats</strong>
              </div>
            </div>
            <div className="meta-panel-body stats-grid">
              <div className="stat-card">
                <span className="stat-value">{clientProjects.length}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{clientProjects.filter(p => p.status === 'active').length}</span>
                <span className="stat-label">Active</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{clientProjects.filter(p => p.status === 'complete').length}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{clientProjects.filter(p => p.status === 'on_hold').length}</span>
                <span className="stat-label">On Hold</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}