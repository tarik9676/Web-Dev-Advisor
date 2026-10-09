import { useCallback, useEffect, useState } from 'react';
import { Calendar, Plus, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/Header.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import DatePicker from '../components/DatePicker.jsx';
import { formatDate, projectName } from '../utils/helpers.js';

const PHASE_CHOICES = [
  ['discovery', 'Discovery'],
  ['architecture', 'Architecture and Planning'],
  ['design', 'Design'],
  ['build', 'Build'],
  ['qa', 'QA and Hardening'],
  ['launch', 'Launch'],
  ['post_launch', 'Post-Launch'],
];

const STATUS_CHOICES = [
  ['not_started', 'Not Started'],
  ['in_progress', 'In Progress'],
  ['completed', 'Completed'],
  ['skipped', 'Skipped'],
];

const STATUS_OPTIONS = STATUS_CHOICES.map(([value]) => value);

function MilestoneForm({ project, milestone, onClose, onSaved }) {
  const { showToast } = useApp();
  const [form, setForm] = useState({
    name: milestone?.name || '',
    description: milestone?.description || '',
    phase: milestone?.phase || 'discovery',
    target_date: milestone?.target_date || '',
    status: milestone?.status || 'not_started',
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.phase) return;
    const payload = { ...form };
    try {
      if (milestone) {
        await api.patch(`/projects/${project.id}/milestones/${milestone.id}/`, payload);
        showToast('Milestone updated', 'success');
      } else {
        await api.post(`/projects/${project.id}/milestones/`, payload);
        showToast('Milestone created', 'success');
      }
      onSaved();
    } catch (error) {
      showToast(error?.body?.error ? 'Check the milestone fields' : 'Milestone update failed', 'error');
    }
  };

  return (
    <Modal title={milestone ? 'Edit milestone' : 'Add milestone'} onClose={onClose} width={520}>
      <form className="form-grid" onSubmit={submit}>
        <label className="span-2">Name<input value={form.name} onChange={(event) => update('name', event.target.value)} required autoFocus /></label>
        <label>Phase<select value={form.phase} onChange={(event) => update('phase', event.target.value)} required>{PHASE_CHOICES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{STATUS_CHOICES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        <label>Target date<DatePicker value={form.target_date} onChange={(val) => update('target_date', val)} placeholder="Select target date" /></label>
        <label className="span-2">Description<textarea rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} placeholder="What this milestone delivers" /></label>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary"><Save size={14} /> Save milestone</button></div>
      </form>
    </Modal>
  );
}

export default function Milestones() {
  const { projectId, audience, projects, selectProject, loadProject, showToast } = useApp();
  const [project, setProject] = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [projectData, milestoneData] = await Promise.all([
        loadProject(projectId),
        api.get(`/projects/${projectId}/milestones/`),
      ]);
      setProject(projectData);
      setMilestones(milestoneData.results || milestoneData);
    } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, [projectId, audience, loadProject]);

  useEffect(() => { load(); }, [load]);

  const save = () => { setCreating(false); setEditing(null); load(); };

  const remove = async (milestone) => {
    if (!window.confirm(`Delete "${milestone.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/projects/${projectId}/milestones/${milestone.id}/`);
      showToast('Milestone deleted', 'success');
      load();
    } catch {
      showToast('Milestone could not be deleted', 'error');
    }
  };

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  if (error) return <ErrorState message="Failed to load milestones" onRetry={load} />;
  if (loading || !milestones) return <div className="page-loading"><SkeletonTable rows={7} /></div>;

  return (
    <div className="page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <header className="page-heading"><div><div className="eyebrow">Delivery / milestones</div><h1>{projectName(project)}</h1><p>Milestones anchor the delivery plan: each carries a phase, a target date, and a status that unlocks billing installments.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={15} /> Add milestone</button></header>
      <section className="panel table-panel">
        <div className="panel-heading"><div><span>Delivery milestones</span><small>{milestones.length} planned</small></div></div>
        {milestones.length ? <div className="table-scroll"><table className="data-table compact-table"><thead><tr><th>Milestone</th><th>Phase</th><th>Status</th><th>Target date</th><th>Description</th><th /></tr></thead><tbody>
          {milestones.map((milestone) => <tr key={milestone.id}><td><strong>{milestone.name}</strong></td><td>{PHASE_CHOICES.find(([v]) => v === milestone.phase)?.[1] || milestone.phase}</td><td><StatusSignal status={milestone.status} /></td><td className="mono">{formatDate(milestone.target_date)}</td><td>{milestone.description || <span className="muted">—</span>}</td><td><div className="inline-actions"><button onClick={() => setEditing(milestone)}>Edit</button><button className="destructive" onClick={() => remove(milestone)}><Trash2 size={14} /></button></div></td></tr>)}
        </tbody></table></div> : <EmptyState message="No milestones recorded yet" action={{ label: 'Add one', onClick: () => setCreating(true) }} />}
      </section>
      {(creating || editing) && <MilestoneForm project={project} milestone={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={save} />}
    </div>
  );
}
