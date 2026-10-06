import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Save, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityDot from '../components/PriorityDot.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate, memberName, projectName } from '../utils/helpers.js';

const STATUSES = ['not_started', 'blocked', 'in_progress', 'internal_review', 'client_review', 'approved', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function TaskForm({ project, workstreams, tasks, task, onClose, onSaved }) {
  const { showToast } = useApp();
  const humans = (project?.team_members || []).filter((member) => member.kind === 'human');
  const allMembers = project?.team_members || [];
  const [form, setForm] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'medium',
    status: task?.status || 'not_started',
    workstream_id: task?.workstream || '',
    assignee_id: task?.assignee?.id || humans[0]?.id || '',
    reviewer_id: task?.reviewer?.id || humans[0]?.id || '',
    due_date: task?.due_date || task?.dueDate || '',
    definition_of_done: task?.definition_of_done || '',
    client_input_required: task?.client_input_required || false,
    client_input_text: task?.client_input_text || '',
    staging_reference: task?.staging_reference || '',
    dependency_ids: task?.dependencies || [],
  });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title || !form.assignee_id) return;
    const payload = {
      ...form,
      dependency_ids: form.dependency_ids.map(Number),
      client_input_required: Boolean(form.client_input_required),
    };
    try {
      if (task) {
        await api.patch(`/workstreams/${task.workstream}/tasks/${task.id}/`, payload);
        showToast('Task updated', 'success');
      } else {
        await api.post(`/workstreams/${form.workstream_id}/tasks/`, payload);
        showToast('Task added to execution queue', 'success');
      }
      onSaved();
    } catch (error) {
      showToast(error?.body?.error ? 'Check the task fields' : 'Task update failed', 'error');
    }
  };

  return (
    <Modal title={task ? 'Edit task' : 'Add task'} onClose={onClose} width={620}>
      <form className="form-grid" onSubmit={submit}>
        {!task && <label>Workstream<select value={form.workstream_id} onChange={(event) => update('workstream_id', event.target.value)} required><option value="">Select workstream</option>{workstreams.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>}
        <label className="span-2">Title<input value={form.title} onChange={(event) => update('title', event.target.value)} required autoFocus /></label>
        <label>Assignee<select value={form.assignee_id} onChange={(event) => update('assignee_id', event.target.value)} required>{allMembers.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.kind}</option>)}</select></label>
        <label>Human reviewer<select value={form.reviewer_id} onChange={(event) => update('reviewer_id', event.target.value)}>{humans.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{STATUSES.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
        <label>Priority<select value={form.priority} onChange={(event) => update('priority', event.target.value)}>{PRIORITIES.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select></label>
        <label>Due date<input type="date" value={form.due_date} onChange={(event) => update('due_date', event.target.value)} /></label>
        <label>Definition of done<textarea rows="3" value={form.definition_of_done} onChange={(event) => update('definition_of_done', event.target.value)} /></label>
        <label className="check-row">Client input required<input type="checkbox" checked={form.client_input_required} onChange={(event) => update('client_input_required', event.target.checked)} /></label>
        <label>Client input / reference<textarea rows="3" value={form.client_input_text} onChange={(event) => update('client_input_text', event.target.value)} /></label>
        <label>Staging reference<input value={form.staging_reference} onChange={(event) => update('staging_reference', event.target.value)} placeholder="https://" /></label>
        <fieldset className="span-2"><legend>Task dependencies</legend><div className="check-grid">{tasks.filter((item) => item.id !== task?.id).map((item) => <label className="check-row" key={item.id}><input type="checkbox" checked={form.dependency_ids.includes(item.id)} onChange={(event) => update('dependency_ids', event.target.checked ? [...form.dependency_ids, item.id] : form.dependency_ids.filter((id) => id !== item.id))} />{item.title}</label>)}</div></fieldset>
        <div className="form-actions span-2"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary"><Save size={14} /> Save task</button></div>
      </form>
    </Modal>
  );
}

export default function Tasks() {
  const { projectId, audience, loadProject, loadTasks, loadWorkstreams, showToast } = useApp();
  const [project, setProject] = useState(null);
  const [workstreams, setWorkstreams] = useState([]);
  const [tasks, setTasks] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [projectData, taskData, streamData] = await Promise.all([loadProject(projectId), loadTasks(projectId), loadWorkstreams(projectId)]);
      setProject(projectData);
      setTasks(taskData?.tasks || taskData || []);
      setWorkstreams(Array.isArray(streamData) ? streamData : streamData.results || []);
    } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, [projectId, audience, loadProject, loadTasks, loadWorkstreams]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => (tasks || []).filter((task) => {
    if (audience === 'client' && String(task.description || '').startsWith('Internal-only')) return false;
    if (statusFilter !== 'all' && task.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
    if (ownerFilter && String(task.assignee?.id || task.assignee_id || '') !== ownerFilter) return false;
    return true;
  }), [tasks, audience, statusFilter, priorityFilter, ownerFilter]);

  const save = () => { setCreating(false); setEditing(null); load(); };
  const transition = async (task, status) => {
    try {
      await api.patch(`/workstreams/${task.workstream}/tasks/${task.id}/`, { status });
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
      showToast(`Task moved to ${status.replaceAll('_', ' ')}`, 'success');
    } catch { showToast('Task update failed', 'error'); }
  };

  if (error) return <ErrorState message="Failed to load tasks" onRetry={load} />;
  if (loading || !tasks) return <div className="page-loading"><SkeletonTable rows={7} /></div>;

  return (
    <div className="page">
      <header className="page-heading"><div><div className="eyebrow">Execution / task queue</div><h1>{projectName(project)}</h1><p>Every task has a human assignee, a human reviewer, and a testable definition of done.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={15} /> Add task</button></header>
      <section className="filter-bar" aria-label="Task filters">
        <label>Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{STATUSES.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
        <label>Priority<select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)}><option value="all">All priorities</option>{PRIORITIES.map((priority) => <option value={priority} key={priority}>{priority}</option>)}</select></label>
        <label>Owner<select value={ownerFilter} onChange={(event) => setOwnerFilter(event.target.value)}><option value="all">All owners</option>{(project?.team_members || []).map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
        <span className="filter-count">{filtered.length} shown</span>
      </section>
      <section className="panel table-panel">
        <div className="panel-heading"><div><span>Task execution</span><small>{audience === 'client' ? 'Client-visible work only' : 'Assignments, review, and delivery signals'}</small></div><span className="panel-count">{filtered.filter((task) => task.status !== 'done').length} active</span></div>
        {filtered.length ? <div className="table-scroll"><table className="data-table compact-table"><thead><tr><th>Task</th><th>Workstream</th><th>Owner / reviewer</th><th>Status</th><th>Priority</th><th>Due</th><th>Client input</th><th /></tr></thead><tbody>
          {filtered.map((task) => <tr key={task.id}><td><strong>{task.title}</strong><small>{task.definition_of_done || task.description}</small></td><td>{workstreams.find((item) => String(item.id) === String(task.workstream))?.name || '—'}</td><td><span>{memberName(task.assignee)}</span><small>Review: {memberName(task.reviewer)}</small></td><td><StatusSignal status={task.status} /></td><td><PriorityDot priority={task.priority} /></td><td className="mono">{formatDate(task.due_date || task.dueDate)}</td><td>{task.client_input_required ? <StatusBadge status="pending" /> : <span className="muted">Not required</span>}</td><td><div className="inline-actions"><button onClick={() => setEditing(task)}>Edit</button><button onClick={() => transition(task, task.status === 'done' ? 'in_progress' : 'done')}>{task.status === 'done' ? 'Reopen' : 'Complete'}</button></div></td></tr>)}
        </tbody></table></div> : <EmptyState message="No tasks match these filters" />}
      </section>
      {(creating || editing) && <TaskForm project={project} workstreams={workstreams} tasks={tasks || []} task={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={save} />}
    </div>
  );
}
