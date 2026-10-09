import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, TriangleAlert } from 'lucide-react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/Header.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import { memberName, projectName } from '../utils/helpers.js';

const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const CATEGORIES = ['technical', 'resource', 'schedule', 'budget', 'client', 'security', 'compliance', 'other'];
const STATUSES = ['identified', 'mitigating', 'resolved', 'accepted'];

function RiskForm({ project, risk, onClose, onSaved }) {
  const { showToast } = useApp();
  const humans = (project?.team_members || []).filter((member) => member.kind === 'human');
  const [form, setForm] = useState({
    title: risk?.title || '',
    description: risk?.description || '',
    severity: risk?.severity || 'medium',
    category: risk?.category || 'other',
    mitigation: risk?.mitigation || '',
    client_visible: risk?.client_visible ?? true,
    status: risk?.status || 'identified',
    owner_id: risk?.owner?.id || humans[0]?.id || '',
  });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.title) return;
    try {
      if (risk) {
        await api.patch(`/projects/${project.id}/risks/${risk.id}/`, form);
        showToast('Risk updated', 'success');
      } else {
        await api.post(`/projects/${project.id}/risks/`, form);
        showToast('Risk added to register', 'success');
      }
      onSaved();
    } catch { showToast('Risk update failed', 'error'); }
  };
  return <Modal title={risk ? 'Edit risk' : 'Add risk'} onClose={onClose}>
    <form className="form-grid" onSubmit={submit}>
      <label className="span-2">Title<input value={form.title} onChange={(event) => update('title', event.target.value)} required autoFocus /></label>
      <label>Description<textarea rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
      <label>Owner<select value={form.owner_id} onChange={(event) => update('owner_id', event.target.value)}>{humans.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
      <label>Severity<select value={form.severity} onChange={(event) => update('severity', event.target.value)}>{SEVERITIES.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Category<select value={form.category} onChange={(event) => update('category', event.target.value)}>{CATEGORIES.map((value) => <option value={value} key={value}>{value.replaceAll('_', ' ')}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{STATUSES.map((value) => <option value={value} key={value}>{value}</option>)}</select></label>
      <label>Mitigation<textarea rows="3" value={form.mitigation} onChange={(event) => update('mitigation', event.target.value)} /></label>
      <label className="check-row">Visible to client<input type="checkbox" checked={form.client_visible} onChange={(event) => update('client_visible', event.target.checked)} /></label>
      <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary"><Save size={14} /> Save risk</button></div>
    </form>
  </Modal>;
}

export default function Risks() {
  const { projectId, audience, projects, selectProject, loadProject, loadRisks, showToast } = useApp();
  const [project, setProject] = useState(null);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const [projectData, riskData] = await Promise.all([loadProject(projectId), loadRisks(projectId)]);
      setProject(projectData);
      setRisks(Array.isArray(riskData) ? riskData : riskData.risks || []);
    } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, [projectId, audience, loadProject, loadRisks]);
  useEffect(() => { load(); }, [load]);
  const visible = useMemo(() => audience === 'client' ? (risks || []).filter((risk) => risk.client_visible) : (risks || []), [risks, audience]);
  const matrix = useMemo(() => {
    const result = {};
    visible.forEach((risk) => { const key = `${risk.severity}|${risk.category}`; result[key] = [...(result[key] || []), risk]; });
    return result;
  }, [visible]);
  const save = () => { setEditing(null); setCreating(false); load(); };
  const updateStatus = async (risk, status) => {
    try {
      await api.patch(`/projects/${project.id}/risks/${risk.id}/`, { status });
      setRisks((current) => current.map((item) => item.id === risk.id ? { ...item, status } : item));
      showToast(`Risk moved to ${status}`, 'success');
    } catch { showToast('Risk update failed', 'error'); }
  };
  if (error) return <ErrorState message="Failed to load risk register" onRetry={load} />;
  if (loading || !risks) return <div className="page-loading"><SkeletonTable rows={6} /></div>;

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };
  return <div className="page">
    <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
    <header className="page-heading"><div><div className="eyebrow">Risk / mitigation register</div><h1>{projectName(project)}</h1><p>Risks stay visible with an owner, mitigation, severity, and a human decision path.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={15} /> Add risk</button></header>
    <section className="risk-summary"><div><TriangleAlert size={19} /><strong>{visible.filter((risk) => ['critical', 'high'].includes(risk.severity)).length}</strong><span>High exposure</span></div><div><strong>{visible.filter((risk) => risk.status === 'mitigating').length}</strong><span>Mitigating</span></div><div><strong>{visible.filter((risk) => risk.status === 'resolved').length}</strong><span>Resolved</span></div></section>
    <section className="panel table-panel"><div className="panel-heading"><div><span>Risk register</span><small>{audience === 'client' ? 'Client-visible risks' : 'Internal and client-visible risks'}</small></div><span className="panel-count">{visible.length} risks</span></div>
      {visible.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Risk</th><th>Category</th><th>Owner</th><th>Severity</th><th>Status</th><th>Mitigation</th><th>Action</th></tr></thead><tbody>
        {visible.map((risk) => <tr key={risk.id}><td><strong>{risk.title}</strong><small>{risk.description}</small></td><td><StatusBadge status={risk.category} /></td><td>{memberName(risk.owner)}</td><td><StatusBadge status={risk.severity} /></td><td><StatusSignal status={risk.status} /></td><td>{risk.mitigation || '—'}</td><td><div className="inline-actions"><button onClick={() => setEditing(risk)}>Edit</button>{risk.status !== 'resolved' && <button onClick={() => updateStatus(risk, 'resolved')}>Resolve</button>}</div></td></tr>)}
      </tbody></table></div> : <EmptyState message="No risks are visible" />}
    </section>
    <section className="panel"><div className="panel-heading"><span>Exposure map</span><small>Severity / category concentration</small></div><div className="risk-matrix">{SEVERITIES.map((severity) => CATEGORIES.map((category) => <div className={`matrix-cell severity-${severity}`} key={`${severity}-${category}`}><span>{severity}</span><span>{category.replaceAll('_', ' ')}</span><strong>{(matrix[`${severity}|${category}`] || []).length}</strong></div>))}</div></section>
    {(creating || editing) && <RiskForm project={project} risk={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={save} />}
  </div>;
}
