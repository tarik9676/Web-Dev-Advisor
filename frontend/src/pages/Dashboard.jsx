import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import Header from '../components/Header.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityDot from '../components/PriorityDot.jsx';
import { SkeletonLines, SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import {
  currentPhase,
  dependencyNames,
  formatDate,
  memberName,
  projectName,
  workstreamAiNames,
  workstreamTaskCounts,
} from '../utils/helpers.js';

const PHASES = ['Discovery', 'Architecture', 'Design', 'Build', 'QA & Hardening', 'Launch', 'Post-Launch'];
const PHASE_INDEX = {
  discovery: 0,
  architecture: 1,
  design: 2,
  build: 3,
  qa: 4,
  launch: 5,
  post_launch: 6,
};

function PhaseRoute({ phase }) {
  const active = PHASE_INDEX[phase] ?? 3;
  return (
    <div className="phase-route" aria-label={`Current phase: ${PHASES[active]}`}>
      {PHASES.map((label, index) => (
        <div className="phase-step" key={label}>
          <span className={`phase-node${index < active ? ' is-complete' : ''}${index === active ? ' is-current' : ''}`}>{index < active ? '✓' : index + 1}</span>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function ReadinessRing({ value }) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="readiness-ring" aria-label={`Launch readiness ${value}%`}>
      <svg viewBox="0 0 88 88">
        <circle className="ring-track" cx="44" cy="44" r={radius} />
        <circle className="ring-value" cx="44" cy="44" r={radius} style={{ strokeDashoffset: circumference - (value / 100) * circumference }} />
      </svg>
      <strong>{value}%</strong>
    </div>
  );
}

export default function Dashboard() {
  const { projectId, audience, projects, selectProject, loadProject, loadDashboard, showToast } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await loadDashboard(projectId, audience);
      setData(result);
    } catch (caught) {
      setError(caught);
    } finally {
      setLoading(false);
    }
  }, [projectId, audience, loadDashboard]);

  useEffect(() => { load(); }, [load]);

  if (error) return <ErrorState message="Failed to load the delivery dashboard" onRetry={load} />;
  if (loading || !data) return <div className="page-loading"><SkeletonLines count={4} /><SkeletonTable rows={5} /></div>;

  const project = data.project || data;
  const workstreams = data.workstreams || [];
  const tasks = data.tasks || [];
  const approvals = data.approval_gates || data.approvals || [];
  const milestones = data.milestones || [];
  const readiness = data.launch_readiness ?? project.readiness ?? 0;
  const phase = currentPhase(milestones) || project.phase || 'build';
  const nextActions = data.next_actions?.length ? data.next_actions : [];
  const nextAction = nextActions[0];
  const visibleTasks = audience === 'client'
    ? tasks.filter((task) => !String(task.description || '').startsWith('Internal-only'))
    : tasks;
  const blockedTasks = tasks.filter((task) => task.status === 'blocked');
  const pendingApprovals = approvals.filter((approval) => approval.status === 'pending');
  const activeWorkstreams = workstreams.filter((workstream) => ['in_progress', 'blocked', 'internal_review', 'client_review'].includes(workstream.status));

  const transitionTask = async (task, status) => {
    try {
      await api.patch(`/workstreams/${task.workstream}/tasks/${task.id}/`, { status: status.replaceAll('-', '_') });
      setData((current) => ({
        ...current,
        tasks: current.tasks.map((item) => item.id === task.id ? { ...item, status: status.replaceAll('-', '_') } : item),
      }));
      showToast(`Task moved to ${status.replaceAll('-', ' ')}`, 'success');
    } catch {
      showToast('Task update failed', 'error');
    }
  };

  const handleProjectChange = (event) => {
    const id = event.target.value;
    selectProject(id);
    loadProject(id);
  };

  return (
    <div className="page dashboard-page">
      <Header project={project} onProjectChange={handleProjectChange} projects={projects} />
      <header className="page-heading dashboard-heading">
        <div>
          <div className="eyebrow">Delivery workspace</div>
          <h1>{projectName(project)}</h1>
          <div className="heading-meta">
            <span>{project.client_name || 'Client'}</span>
            <span className="meta-separator" />
            <span>Phase <strong>{phase.replaceAll('_', ' ')}</strong></span>
            <span className="meta-separator" />
            <StatusSignal status={project.status || 'active'} />
          </div>
        </div>
        <ReadinessRing value={readiness} />
      </header>

      <section className="metric-band" aria-label="Project signals">
        <div><span>Launch readiness</span><strong>{readiness}%</strong><small>of delivery milestones</small></div>
        <div><span>Active workstreams</span><strong>{activeWorkstreams.length}</strong><small>of {workstreams.length} planned</small></div>
        <div><span>Open blockers</span><strong className="danger-text">{blockedTasks.length}</strong><small>tasks need attention</small></div>
        <div><span>Pending approvals</span><strong className="warn-text">{pendingApprovals.length}</strong><small>human decisions</small></div>
      </section>

      <section className="dashboard-grid">
        <div className="panel phase-panel">
          <div className="panel-heading"><span>Phase / gate progress</span><span className="panel-kicker">Live route</span></div>
          <PhaseRoute phase={phase} />
          <div className="milestone-strip">
            {milestones.slice(0, 4).map((milestone) => (
              <div key={milestone.id}><StatusSignal status={milestone.status} /><span>{milestone.name}</span></div>
            ))}
          </div>
        </div>
        <div className="panel action-panel">
          <div className="panel-heading"><span>Next required action</span><span className="panel-kicker">Owner action</span></div>
          {nextAction ? (
            <>
              <strong className="action-title">{nextAction.title}</strong>
              <div className="action-meta"><StatusSignal status={nextAction.status} /><span>{nextAction.type}</span></div>
            </>
          ) : <p className="muted">No urgent action is waiting on the team.</p>}
        </div>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading"><div><span>Workstream signals</span><small>Human ownership / AI support / delivery state</small></div><span className="panel-count">{workstreams.length} streams</span></div>
        {workstreams.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead><tr><th>Workstream</th><th>Owner</th><th>AI support</th><th>Status</th><th>Tasks</th><th>Gate</th><th>Signal</th></tr></thead>
              <tbody>
                {workstreams.map((workstream) => {
                  const counts = workstreamTaskCounts(workstream, tasks);
                  return (
                    <tr key={workstream.id}>
                      <td><strong>{workstream.name}</strong><small>{dependencyNames(workstream.dependencies, workstreams)}</small></td>
                      <td>{memberName(workstream.human_owner || workstream.owner)}</td>
                      <td className="mono">{workstreamAiNames(workstream)}</td>
                      <td><StatusSignal status={workstream.status} /></td>
                      <td className="mono">{counts.completed}/{counts.total}</td>
                      <td className="gate-cell">{workstream.approval_gate || workstream.approvalGate || '—'}</td>
                      <td>{workstream.status === 'blocked' ? <StatusBadge status="blocked" /> : <StatusBadge status={workstream.status} />}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No workstreams have been planned" />}
      </section>

      <section className="panel table-panel task-panel">
        <div className="panel-heading"><div><span>Recent tasks</span><small>{audience === 'client' ? 'Client-visible work' : 'Team execution queue'}</small></div><span className="panel-count">{visibleTasks.filter((task) => task.status !== 'done').length} active</span></div>
        {visibleTasks.length ? (
          <div className="table-scroll">
            <table className="data-table compact-table">
              <thead><tr><th>Task</th><th>Owner</th><th>Status</th><th>Priority</th><th>Due</th><th>Action</th></tr></thead>
              <tbody>
                {visibleTasks.slice(0, 8).map((task) => (
                  <tr key={task.id}>
                    <td><strong>{task.title}</strong><small>{task.workstream_name || workstreams.find((item) => String(item.id) === String(task.workstream))?.name}</small></td>
                    <td>{memberName(task.assignee || task.owner)}</td>
                    <td><StatusSignal status={task.status} /></td>
                    <td><PriorityDot priority={task.priority} /></td>
                    <td className="mono">{formatDate(task.due_date || task.dueDate)}</td>
                    <td>
                      <div className="inline-actions">
                        {['in_progress', 'internal_review', 'done'].filter((status) => status !== task.status).map((status) => (
                          <button key={status} onClick={() => transitionTask(task, status)}>{status.replaceAll('_', ' ')}</button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <EmptyState message="No tasks are visible in this audience" />}
      </section>
    </div>
  );
}
