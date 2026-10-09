import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Save, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/Header.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SkeletonLines, SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import { dependencyNames, memberName, projectName, workstreamAiNames, workstreamTaskCounts } from '../utils/helpers.js';

const STATUSES = ['not_started', 'blocked', 'in_progress', 'internal_review', 'client_review', 'approved', 'done'];

function WorkstreamForm({ project, workstream, onClose, onSaved }) {
  const { showToast } = useApp();
  const humans = (project?.team_members || []).filter((member) => member.kind === 'human');
  const aiMembers = (project?.team_members || []).filter((member) => member.kind === 'ai');
  const [form, setForm] = useState(() => ({
    name: workstream?.name || '',
    slug: workstream?.slug || '',
    status: workstream?.status || 'not_started',
    description: '',
    inputs: workstream?.inputs || '',
    outputs: workstream?.outputs || '',
    acceptance_criteria: workstream?.acceptance_criteria || '',
    approval_gate: workstream?.approval_gate || '',
    human_owner_id: workstream?.human_owner?.id || humans[0]?.id || '',
    contributor_ids: workstream?.contributors?.map((member) => member.id) || [],
    ai_assistant_ids: workstream?.ai_assistants?.map((member) => member.id) || [],
  }));
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.slug || !form.human_owner_id) return;
    const payload = {
      ...form,
      contributor_ids: form.contributor_ids.map(Number),
      ai_assistant_ids: form.ai_assistant_ids.map(Number),
    };
    try {
      if (workstream) {
        await api.patch(`/projects/${project.id}/workstreams/${workstream.id}/`, payload);
        showToast('Workstream updated', 'success');
      } else {
        await api.post(`/projects/${project.id}/workstreams/`, payload);
        showToast('Workstream added to plan', 'success');
      }
      onSaved();
    } catch (error) {
      showToast(error?.body?.error ? 'Check the required fields' : 'Workstream update failed', 'error');
    }
  };

  return (
    <Modal title={workstream ? 'Edit workstream' : 'Add workstream'} onClose={onClose}>
      <form className="form-grid" onSubmit={submit}>
        <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} required autoFocus /></label>
        <label>Slug<input value={form.slug} onChange={(event) => update('slug', event.target.value)} required /></label>
        <label>Human owner<select value={form.human_owner_id} onChange={(event) => update('human_owner_id', event.target.value)} required>{humans.map((member) => <option value={member.id} key={member.id}>{member.name} · {member.role.replaceAll('_', ' ')}</option>)}</select></label>
        <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{STATUSES.map((status) => <option value={status} key={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
        <label>Description<textarea rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
        <label>Inputs<textarea rows="3" value={form.inputs} onChange={(event) => update('inputs', event.target.value)} /></label>
        <label>Outputs<textarea rows="3" value={form.outputs} onChange={(event) => update('outputs', event.target.value)} /></label>
        <label>Acceptance criteria<textarea rows="3" value={form.acceptance_criteria} onChange={(event) => update('acceptance_criteria', event.target.value)} /></label>
        <label>Approval gate<input value={form.approval_gate} onChange={(event) => update('approval_gate', event.target.value)} /></label>
        <fieldset><legend>Contributors</legend><div className="check-grid">{(project?.team_members || []).map((member) => <label className="check-row" key={member.id}><input type="checkbox" checked={form.contributor_ids.includes(member.id)} onChange={(event) => update('contributor_ids', event.target.checked ? [...form.contributor_ids, member.id] : form.contributor_ids.filter((id) => id !== member.id))} />{member.name}</label>)}</div></fieldset>
        <fieldset><legend>AI assistants</legend><div className="check-grid">{aiMembers.map((member) => <label className="check-row" key={member.id}><input type="checkbox" checked={form.ai_assistant_ids.includes(member.id)} onChange={(event) => update('ai_assistant_ids', event.target.checked ? [...form.ai_assistant_ids, member.id] : form.ai_assistant_ids.filter((id) => id !== member.id))} />{member.name}</label>)}</div></fieldset>
        <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary"><Save size={14} /> Save workstream</button></div>
      </form>
    </Modal>
  );
}

export default function Plan() {
  const { projectId, audience, projects, selectProject, loadProject, loadWorkstreams, loadTasks, showToast } = useApp();
  const [project, setProject] = useState(null);
  const [workstreams, setWorkstreams] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [projectData, streamData, taskData] = await Promise.all([
        loadProject(projectId),
        loadWorkstreams(projectId),
        loadTasks(projectId),
      ]);
      setProject(projectData);
      setWorkstreams(Array.isArray(streamData) ? streamData : streamData.results || []);
      setTasks(taskData?.tasks || taskData || []);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }, [projectId, audience, loadProject, loadWorkstreams, loadTasks]);

  useEffect(() => { load(); }, [load]);

  const save = () => {
    setCreating(false);
    setEditing(null);
    load();
  };

  const visibleStreams = useMemo(() => workstreams || [], [workstreams]);

  if (error) return <ErrorState message="Failed to load the project plan" onRetry={load} />;
  if (loading || !workstreams) return <div className="page-loading"><SkeletonLines count={3} /><SkeletonTable rows={6} /></div>;

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  return (
    <div className="page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <header className="page-heading"><div><div className="eyebrow">Plan / ownership map</div><h1>{projectName(project)}</h1><p>Workstreams are bounded by inputs, outputs, acceptance criteria, and a human approval gate.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={15} /> Add workstream</button></header>
      <section className="panel table-panel">
        <div className="panel-heading"><div><span>Delivery workstreams</span><small>{audience === 'client' ? 'Client-visible scope and gates' : 'Employees and AI agents work in parallel'}</small></div><span className="panel-count">{visibleStreams.length} streams</span></div>
        {visibleStreams.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Workstream</th><th>Owner</th><th>AI support</th><th>Status</th><th>Tasks</th><th>Dependencies</th><th>Acceptance gate</th><th /></tr></thead><tbody>
          {visibleStreams.map((workstream) => {
                  const counts = workstreamTaskCounts(workstream, tasks);
                  return <tr key={workstream.id}><td><strong>{workstream.name}</strong><small>{workstream.description || workstream.outputs}</small></td><td>{memberName(workstream.human_owner || workstream.owner)}</td><td className="mono">{workstreamAiNames(workstream)}</td><td><StatusSignal status={workstream.status} /></td><td className="mono">{counts.completed}/{counts.total}</td><td>{dependencyNames(workstream.dependencies, visibleStreams)}</td><td className="gate-cell">{workstream.approval_gate || '—'}</td><td><div className="inline-actions"><button onClick={() => setEditing(workstream)}>Edit</button></div></td></tr>;
                })}</tbody></table></div> : <EmptyState message="No workstreams in this project" action={{ label: 'Add one', onClick: () => setCreating(true) }} />}
      </section>
      {(creating || editing) && <WorkstreamForm project={project} workstream={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={save} />}
    </div>
  );
}
