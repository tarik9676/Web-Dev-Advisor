import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, Globe } from 'lucide-react';
import { servicesApi } from '../../api/products';

function ServiceRow({ service, onEdit, onDelete, onView }) {
  return (
    <tr>
      <td>
        <strong>{service.name}</strong>
        <br />
        <small>{service.slug}</small>
      </td>
      <td>{service.short_description || service.description?.slice(0, 80) || ''}</td>
      <td>
        <span className={`status-badge ${service.status === 'active' ? '' : service.status === 'draft' ? 'draft' : 'archived'}`}>
          {service.status}
        </span>
      </td>
      <td>
        <div className="inline-actions">
          <button className="button secondary" onClick={() => onView(service.slug)} title="View public page" type="button">
            <Globe size={14} />
          </button>
          <button className="button secondary" onClick={() => onEdit(service)} title="Edit" type="button">
            <Edit size={14} />
          </button>
          <button className="button secondary danger" onClick={() => onDelete(service.slug)} title="Delete" type="button">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingSlug, setDeletingSlug] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const data = await servicesApi.getAll({});
      setServices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/app/admin/services/new');
  };

  const handleEdit = (service) => {
    navigate(`/app/admin/services/${service.slug}/edit`);
  };

  const handleView = (slug) => {
    window.open(`/services/${slug}`, '_blank');
  };

  const handleDelete = async (slug) => {
    if (!confirm('Delete this service?')) return;
    setDeletingSlug(slug);
    try {
      await servicesApi.delete(slug);
      setServices(prev => prev.filter(s => s.slug !== slug));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingSlug(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-table">
          <div className="skeleton-row">
            <span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page services-admin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Services</h1>
          <p>Manage service offerings and their page content</p>
        </div>
        <button className="button primary" onClick={handleCreate} type="button">
          <Plus size={14} /> Add Service
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Description</th>
                <th>Status</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map(service => (
                <ServiceRow
                  key={service.slug}
                  service={service}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                />
              ))}
              {services.length === 0 && (
                <tr>
                  <td colSpan={4} className="state-panel">
                    No services yet. Click "Add Service" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}