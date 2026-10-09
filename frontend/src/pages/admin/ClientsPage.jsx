import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Eye, ExternalLink, Mail, Phone, MapPin, User } from 'lucide-react';
import { clientsApi } from '../../api/clients';
import { formatDate } from '../../utils/helpers';
import { useApp } from '../../context/AppContext.jsx';
import Header from '../../components/Header.jsx';

function getInitials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '—';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function ClientRow({ client, onView, onEdit, onDelete, deleting }) {
  const locationParts = [client.city, client.postal_code, client.country].filter(Boolean);
  const location = locationParts.join(', ') || '—';

  return (
    <tr className={deleting ? 'deleting' : ''}>
      <td>
        <div className="client-cell">
          <div className="client-avatar">
            {client.profile_image ? (
              <img src={client.profile_image} alt="" onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              getInitials(client.name)
            )}
          </div>
          <div className="client-info">
            <strong>{client.name}</strong>
            {client.email && <small><Mail size={10} aria-hidden="true" /> {client.email}</small>}
          </div>
        </div>
      </td>
      <td>{client.company || '—'}</td>
      <td>{client.phone || '—'}</td>
      <td className="location-cell">{location}</td>
      <td>
        {client.user_username ? (
          <span className="mono">{client.user_username}</span>
        ) : (
          <span className="text-muted">No account</span>
        )}
      </td>
      <td>{formatDate(client.created_at)}</td>
      <td>
        <div className="inline-actions">
          <button
            className="button secondary"
            onClick={() => onView(client)}
            type="button"
            title="View profile"
          >
            <Eye size={14} />
          </button>
          <button
            className="button secondary"
            onClick={() => onEdit(client)}
            type="button"
            title="Edit"
          >
            <Edit size={14} />
          </button>
          <button
            className="button secondary danger"
            onClick={() => onDelete(client)}
            type="button"
            title="Delete"
            disabled={deleting}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ClientsPage() {
  const { projectId, projects, selectProject, loadProject } = useApp();
  const project = projects.find((item) => String(item.id) === String(projectId)) || projects[0];
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await clientsApi.getAll({});
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    navigate('/app/clients/new');
  };

  const handleView = (client) => {
    navigate(`/app/clients/${client.id}`);
  };

  const handleEdit = (client) => {
    navigate(`/app/clients/${client.id}/edit`);
  };

  const handleDelete = async (client) => {
    if (!confirm(`Delete "${client.name}"? This will also delete their linked user account.`)) return;
    setDeletingId(client.id);
    setError(null);
    try {
      await clientsApi.delete(client.id);
      setClients((prev) => prev.filter((c) => c.id !== client.id));
      setNotice('Client deleted.');
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page clients-page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <div className="page-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Clients</h1>
          <p>Manage client profiles and their linked user accounts</p>
        </div>
        <button className="button primary" onClick={handleCreate} type="button">
          <Plus size={14} /> New Client
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}
      {notice && <div className="toast">{notice}</div>}

      <div className="panel table-panel">
        <div className="panel-heading">
          <div>
            <span>All clients</span>
            <small>Visible to the whole team</small>
          </div>
          <span className="panel-count">{clients.length}</span>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Phone</th>
                <th>Location</th>
                <th>Account</th>
                <th>Created</th>
                <th style={{ width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="state-panel">Loading clients...</td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="state-panel">No clients yet. Click "New Client" to create one.</td>
                </tr>
              ) : (
                clients.map((client) => (
                  <ClientRow
                    key={client.id}
                    client={client}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    deleting={deletingId === client.id}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}