import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Save, ArrowLeft, Users, Trash2, Plus } from 'lucide-react';
import ListEntriesField from '../../components/ListEntriesField';
import { projectsApi } from '../../api/projects';

const STATUS_CHOICES = [
  ['planning', 'Planning'],
  ['active', 'Active'],
  ['on_hold', 'On Hold'],
  ['complete', 'Complete'],
  ['archived', 'Archived'],
];

const KIND_CHOICES = [
  ['human', 'Human'],
  ['ai', 'AI'],
];

const ROLE_CHOICES = [
  ['project_lead', 'Project Lead'],
  ['client_lead', 'Client Lead'],
  ['designer', 'Designer'],
  ['developer', 'Developer'],
  ['senior_developer', 'Senior Developer'],
  ['technical_lead', 'Technical Lead'],
  ['qa_tester', 'QA Tester'],
  ['qa_lead', 'QA Lead'],
  ['woocommerce_specialist', 'WooCommerce Specialist'],
  ['seo_specialist', 'SEO Specialist'],
  ['copywriter', 'Copywriter'],
  ['requirements_agent', 'Requirements Agent (AI)'],
  ['ux_agent', 'UX Agent (AI)'],
  ['design_assistant', 'Design Assistant (AI)'],
  ['wordpress_developer_agent', 'WordPress Developer Agent (AI)'],
  ['plugin_developer_agent', 'Plugin Developer Agent (AI)'],
  ['woocommerce_setup_agent', 'WooCommerce Setup Agent (AI)'],
  ['content_agent', 'Content Agent (AI)'],
  ['seo_agent', 'SEO Agent (AI)'],
  ['qa_agent', 'QA Agent (AI)'],
  ['performance_agent', 'Performance Agent (AI)'],
  ['security_agent', 'Security Agent (AI)'],
  ['documentation_agent', 'Documentation Agent (AI)'],
];

const EMPTY_PROJECT = {
  client_name: '',
  project_name: '',
  slug: '',
  brief: '',
  goals: '',
  target_audience: '',
  success_metrics: [],
  regions: [],
  budget: '',
  currency: 'USD',
  deadline: '',
  launch_date: '',
  staging_url: '',
  status: 'planning',
};

const EMPTY_TEAM_MEMBER = { name: '', role: 'developer', kind: 'human', email: '', client_access: false };

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function ProjectEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [project, setProject] = useState(EMPTY_PROJECT);
  const [team, setTeam] = useState([]);
  const [access, setAccess] = useState([]);
  const [newMember, setNewMember] = useState({ name: '', role: 'developer', kind: 'human', email: '', client_access: false });
  const [addUsername, setAddUsername] = useState('');
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    if (isNew) {
      setProject({ ...EMPTY_PROJECT });
      setTeam([]);
      setAccess([]);
      setLoading(false);
    } else {
      loadProject(id);
    }
  }, [id, isNew]);

  const loadProject = async (projectId) => {
    try {
      const data = await projectsApi.getById(projectId);
      setProject({ ...EMPTY_PROJECT, ...data });
      setTeam(Array.isArray(data.team_members) ? data.team_members : []);
      const memberList = await projectsApi.getMembers(projectId);
      setAccess(Array.isArray(memberList) ? memberList : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const setField = (key, value) => {
    setProject(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!project.client_name.trim()) {
      setError('Client name is required');
      return;
    }
    if (!project.project_name.trim()) {
      setError('Project name is required');
      return;
    }
    const slug = slugify(project.slug || project.project_name);
    if (!slug) {
      setError('A slug could not be derived — enter one manually');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      ...project,
      slug,
      budget: project.budget === '' ? null : project.budget,
      deadline: project.deadline || null,
      launch_date: project.launch_date || null,
    };
    delete payload.id;
    delete payload.team_members;
    delete payload.created_at;
    delete payload.updated_at;

    try {
      if (isNew) {
        const created = await projectsApi.create(payload);
        navigate(`/app/projects/${created.id}/edit`, { replace: true });
      } else {
        const updated = await projectsApi.update(id, payload);
        setProject(prev => ({ ...prev, ...updated }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAddTeamMember = async () => {
    if (!newMember.name.trim()) {
      setError('Team member name is required');
      return;
    }
    setError(null);
    try {
      const created = await projectsApi.createTeamMember(id, newMember);
      setTeam(prev => [...prev, created]);
      setNewMember({ ...EMPTY_TEAM_MEMBER });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveTeamMember = async (member) => {
    setError(null);
    try {
      await projectsApi.deleteTeamMember(id, member.id);
      setTeam(prev => prev.filter(m => m.id !== member.id));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddAccess = async () => {
    const username = addUsername.trim();
    if (!username) {
      setError('Username is required');
      return;
    }
    setError(null);
    try {
      const added = await projectsApi.addMember(id, { username });
      setAccess(prev => (prev.some(u => u.id === added.id) ? prev : [...prev, added]));
      setAddUsername('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveAccess = async (user) => {
    setError(null);
    try {
      await projectsApi.removeMember(id, { user_id: user.id });
      setAccess(prev => prev.filter(u => u.id !== user.id));
    } catch (err) {
      setError(err.message);
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
    <div className="page project-edit-page">
      <div className="edit-header">
        <div className="edit-header-left">
          <button className="button secondary" onClick={() => navigate('/app/projects')} type="button">
            <ArrowLeft size={14} /> Back
          </button>
          <span className="eyebrow">Admin / {isNew ? 'New Project' : 'Edit Project'}</span>
          <h1>{isNew ? 'New Project' : project?.project_name || 'Untitled'}</h1>
        </div>
        <div className="edit-header-right">
          <button className="button primary" onClick={handleSave} disabled={saving} type="button">
            {saving ? <Loader2 size={14} className="spin" /> : <><Save size={14} /> {isNew ? 'Create Project' : 'Save Changes'}</>}
          </button>
        </div>
      </div>

      {error && <div className="toast toast-error" style={{ margin: '0 24px 16px' }}>{error}</div>}

      <div className="edit-tabs" role="tablist" aria-label="Project editor sections">
        <button
          type="button"
          role="tab"
          className={`edit-tab${activeTab === 'details' ? ' active' : ''}`}
          aria-selected={activeTab === 'details'}
          onClick={() => setActiveTab('details')}
        >
          <Users size={14} aria-hidden="true" /> Project Details
        </button>
        <button
          type="button"
          role="tab"
          className={`edit-tab${activeTab === 'team' ? ' active' : ''}`}
          aria-selected={activeTab === 'team'}
          onClick={() => setActiveTab('team')}
        >
          <Users size={14} aria-hidden="true" /> Team &amp; Access
          {team.length > 0 && <span className="edit-tab-count">{team.length}</span>}
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="panel meta-panel">
          <div className="panel-heading">
            <div>
              <strong>Project Details</strong>
              <small>Scope, budget, and dates for this engagement. A human owner sets these — clients cannot.</small>
            </div>
          </div>
          <div className="meta-panel-body">
            <div className="form-grid">
              <label>
                <span>Client Name <em className="meta-required">*</em></span>
                <input
                  type="text"
                  value={project.client_name}
                  onChange={(e) => {
                    const client_name = e.target.value;
                    setProject(prev => ({
                      ...prev,
                      client_name,
                      slug: isNew && prev.slug === slugify(prev.project_name) ? slugify(client_name) : prev.slug,
                    }));
                  }}
                  placeholder="Acme Inc."
                />
              </label>
              <label>
                <span>Project Name <em className="meta-required">*</em></span>
                <input
                  type="text"
                  value={project.project_name}
                  onChange={(e) => {
                    const project_name = e.target.value;
                    setProject(prev => ({
                      ...prev,
                      project_name,
                      slug: isNew && prev.slug === slugify(prev.project_name) ? slugify(project_name) : prev.slug,
                    }));
                  }}
                  placeholder="Storefront Replatform"
                />
              </label>
              <label>
                <span>Slug</span>
                <input
                  type="text"
                  value={project.slug}
                  onChange={(e) => setField('slug', slugify(e.target.value))}
                  placeholder="acme-storefront"
                />
              </label>
              <label>
                <span>Status</span>
                <select value={project.status} onChange={(e) => setField('status', e.target.value)}>
                  {STATUS_CHOICES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label>
                <span>Budget</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={project.budget}
                  onChange={(e) => setField('budget', e.target.value)}
                  placeholder="15000"
                />
              </label>
              <label>
                <span>Currency</span>
                <input type="text" maxLength={3} value={project.currency} onChange={(e) => setField('currency', e.target.value.toUpperCase())} placeholder="USD" />
              </label>
              <label>
                <span>Deadline</span>
                <input type="date" value={project.deadline || ''} onChange={(e) => setField('deadline', e.target.value)} />
              </label>
              <label>
                <span>Launch Date</span>
                <input type="date" value={project.launch_date || ''} onChange={(e) => setField('launch_date', e.target.value)} />
              </label>
              <label className="span-2">
                <span>Staging URL</span>
                <input type="url" value={project.staging_url} onChange={(e) => setField('staging_url', e.target.value)} placeholder="https://staging.example.com" />
              </label>
              <label className="span-2">
                <span>Brief</span>
                <textarea rows={4} value={project.brief} onChange={(e) => setField('brief', e.target.value)} />
              </label>
              <label className="span-2">
                <span>Goals</span>
                <textarea rows={3} value={project.goals} onChange={(e) => setField('goals', e.target.value)} />
              </label>
              <label className="span-2">
                <span>Target Audience</span>
                <textarea rows={2} value={project.target_audience} onChange={(e) => setField('target_audience', e.target.value)} />
              </label>
              <div className="span-2">
                <span className="field-label">Success Metrics</span>
                <ListEntriesField
                  value={project.success_metrics}
                  onChange={(next) => setField('success_metrics', next)}
                  placeholder="e.g. LCP under 2.5s"
                  addLabel="Add metric"
                  emptyLabel="No success metrics defined yet."
                />
              </div>
              <div className="span-2">
                <span className="field-label">Regions</span>
                <ListEntriesField
                  value={project.regions}
                  onChange={(next) => setField('regions', next)}
                  placeholder="e.g. EU"
                  addLabel="Add region"
                  emptyLabel="No regions listed yet."
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <>
          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Workspace Access</strong>
                <small>Accounts that can sign in and open this project. Clients get read-only participation.</small>
              </div>
            </div>
            <div className="meta-panel-body">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th style={{ width: '60px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {access.map(user => (
                      <tr key={user.id}>
                        <td>
                          <strong>{user.full_name || user.username}</strong>
                          {user.is_staff && <span className="status-badge draft" style={{ marginLeft: '8px' }}>staff</span>}
                        </td>
                        <td>{user.email || '—'}</td>
                        <td>
                          <div className="inline-actions">
                            <button className="button secondary danger" onClick={() => handleRemoveAccess(user)} title="Remove access" type="button">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {access.length === 0 && (
                      <tr>
                        <td colSpan={3} className="state-panel">No one can open this project yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="form-grid" style={{ marginTop: '16px' }}>
                <label>
                  <span>Add by username</span>
                  <div className="inline-actions">
                    <input
                      type="text"
                      value={addUsername}
                      onChange={(e) => setAddUsername(e.target.value)}
                      placeholder="client-username"
                    />
                    <button className="button secondary" onClick={handleAddAccess} type="button">
                      <Plus size={14} /> Grant
                    </button>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="panel meta-panel">
            <div className="panel-heading">
              <div>
                <strong>Team Roster</strong>
                <small>Named humans and AI agents. Workstreams need a human owner; tasks need a human assignee and reviewer.</small>
              </div>
            </div>
            <div className="meta-panel-body">
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Kind</th>
                      <th>Client</th>
                      <th style={{ width: '60px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.map(member => (
                      <tr key={member.id}>
                        <td>
                          <strong>{member.name}</strong>
                          {member.email && <><br /><small>{member.email}</small></>}
                        </td>
                        <td>{(ROLE_CHOICES.find(([value]) => value === member.role) || [member.role])[1]}</td>
                        <td>{member.kind}</td>
                        <td>{member.client_access ? 'yes' : '—'}</td>
                        <td>
                          <div className="inline-actions">
                            <button className="button secondary danger" onClick={() => handleRemoveTeamMember(member)} title="Remove" type="button">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {team.length === 0 && (
                      <tr>
                        <td colSpan={5} className="state-panel">No team members yet. Add a human project lead to get started.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="form-grid" style={{ marginTop: '16px' }}>
                <label>
                  <span>Name <em className="meta-required">*</em></span>
                  <input type="text" value={newMember.name} onChange={(e) => setNewMember(prev => ({ ...prev, name: e.target.value }))} placeholder="Alice Moreno" />
                </label>
                <label>
                  <span>Role</span>
                  <select value={newMember.role} onChange={(e) => setNewMember(prev => ({ ...prev, role: e.target.value }))}>
                    {ROLE_CHOICES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Kind</span>
                  <select value={newMember.kind} onChange={(e) => setNewMember(prev => ({ ...prev, kind: e.target.value }))}>
                    {KIND_CHOICES.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Email</span>
                  <input type="email" value={newMember.email} onChange={(e) => setNewMember(prev => ({ ...prev, email: e.target.value }))} placeholder="alice@example.com" />
                </label>
                <div className="check-grid">
                  <label className="check-row">
                    <input
                      type="checkbox"
                      checked={newMember.client_access}
                      onChange={(e) => setNewMember(prev => ({ ...prev, client_access: e.target.checked }))}
                    />
                    <span>Client-facing</span>
                  </label>
                </div>
              </div>
              <button className="button secondary" onClick={handleAddTeamMember} type="button">
                <Plus size={14} /> Add Team Member
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}