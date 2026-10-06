import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react';
import { projectsApi } from '../../api/projects';

const STATUS_LABELS = {
  planning: 'Planning',
  active: 'Active',
  on_hold: 'On Hold',
  complete: 'Complete',
  archived: 'Archived',
};

function formatBudget(project) {
  if (project.budget === null || project.budget === undefined || project.budget === '') return '—';
  return `${project.currency || 'USD'} ${Number(project.budget).toLocaleString()}`;
}

function ProjectRow({ project, onEdit, onDelete, onView }) {
  return (
    <tr>
      <td>
        <strong>{project.project_name}</strong>
        <br />
        <small>{project.client_name} · {project.slug}</small>
      </td>
      <td>
        <span className={`status-badge ${project.status === 'active' ? '' : project.status === 'planning' ? 'draft' : 'archived'}`}>
          {STATUS_LABELS[project.status] || project.status}
        </span>
      </td>
      <td>{formatBudget(project)}</td>
      <td>{(project.team_members || []).length}</td>
      <td>{project.deadline || '—'}</td>
      <td>
        <div className="inline-actions">
          <button className="button secondary" onClick={() => onView(project)} title="Open in workspace" type="button">
            <FolderOpen size={14} />
          </button>
          <button className="button secondary" onClick={() => onEdit(project)} title="Edit" type="button">
            <Edit size={14} />
          </button>
          <button className="button secondary danger" onClick={() => onDelete(project)} title="Delete" type="button">
            <Trash2 size={14} />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function ProjectsAdminPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await projectsApi.getAll({});
      setProjects(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    navigate('/app/projects/new');
  };

  const handleEdit = (project) => {
    navigate(`/app/projects/${project.id}/edit`);
  };

  const handleView = (project) => {
    navigate(`/app/dashboard?project=${project.id}`);
  };

  const handleDelete = async (project) => {
    const label = `${project.client_name} — ${project.project_name}`;
    if (!confirm(`Delete "${label}"? This removes its workstreams, tasks, approvals, and risks.`)) return;
    setDeletingId(project.id);
    setError(null);
    try {
      await projectsApi.delete(project.id);
      setProjects(prev => prev.filter(p => p.id !== project.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton-table">
          <div className="skeleton-row">
            <span /><span /><span /><span /><span /><span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page projects-admin-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Projects</h1>
          <p>Open a delivery project and manage who on the team can access it</p>
        </div>
        <button className="button primary" onClick={handleCreate} type="button">
          <Plus size={14} /> New Project
        </button>
      </div>

      {error && <div className="toast toast-error">{error}</div>}

      <div className="panel table-panel">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Status</th>
                <th>Budget</th>
                <th>Team</th>
                <th>Deadline</th>
                <th style={{ width: '140px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <ProjectRow
                  key={project.id}
                  project={project}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  deleting={deletingId === project.id}
                />
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={6} className="state-panel">
                    No projects yet. Click &quot;New Project&quot; to open one for a client.
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