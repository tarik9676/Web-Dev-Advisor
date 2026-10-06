import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Check, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SkeletonLines } from '../components/Skeleton.jsx';
import ErrorState from '../components/ErrorState.jsx';
import { currencyValue, formatDate, projectName } from '../utils/helpers.js';

const RULES = [
  { title: 'Human accountability', text: 'AI agents produce bounded deliverables. A named human owns every workstream, decision, and launch gate.' },
  { title: 'Review before release', text: 'Client-facing, financial, security, production, and scope changes require a human approval record.' },
  { title: 'One source of truth', text: 'Requirements, decisions, dependencies, blockers, and acceptance criteria live in the project workspace.' },
  { title: 'Parallel with dependencies', text: 'Discovery, design, build, QA, and launch work can run in parallel only when their inputs are ready.' },
];

export default function Knowledge() {
  const { projectId, audience, loadKnowledge } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openChecklist, setOpenChecklist] = useState({});
  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try { setData(await loadKnowledge(projectId)); } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, [projectId, audience, loadKnowledge]);
  useEffect(() => { load(); }, [load]);
  if (error) return <ErrorState message="Failed to load project knowledge" onRetry={load} />;
  if (loading || !data) return <div className="page-loading"><SkeletonLines count={5} /></div>;
  const project = data.project || {};
  const decisions = data.decisions || [];
  const milestones = data.milestones || [];
  const visibleDecisions = audience === 'client' ? decisions.filter((decision) => decision.client_visible) : decisions;
  const completed = milestones.filter((milestone) => milestone.status === 'completed').length;
  const progress = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;
  return <div className="page knowledge-page">
    <header className="page-heading"><div><div className="eyebrow">Knowledge / shared context</div><h1>{projectName(project)}</h1><p>The brief, success measures, decisions, operating rules, and launch evidence stay together.</p></div><div className="knowledge-progress"><span>Launch evidence</span><strong>{progress}%</strong></div></header>
    <section className="knowledge-grid">
      <div className="panel brief-panel"><div className="panel-heading"><span>Project brief</span><BookOpen size={16} /></div><div className="brief-grid"><div><small>Business goal</small><p>{project.goals || project.brief || '—'}</p></div><div><small>Target audience</small><p>{project.target_audience || '—'}</p></div><div><small>Budget</small><p>{project.budget === null || project.budget === undefined ? 'Staff only' : currencyValue(project.budget, project.currency)}</p></div><div><small>Launch target</small><p>{formatDate(project.launch_date || project.deadline)}</p></div></div><div className="metrics-list"><small>Success metrics</small>{(project.success_metrics || []).map((metric, index) => <div key={index}><span className="metric-index">{index + 1}</span>{metric}</div>)}</div></div>
      <div className="panel rules-panel"><div className="panel-heading"><span>Operating rules</span><ShieldCheck size={16} /></div>{RULES.map((rule) => <div className="rule-row" key={rule.title}><span className="rule-index">0{RULES.indexOf(rule) + 1}</span><div><strong>{rule.title}</strong><p>{rule.text}</p></div></div>)}</div>
    </section>
    <section className="panel table-panel"><div className="panel-heading"><div><span>Milestones</span><small>Evidence required before launch</small></div><span className="panel-count">{completed}/{milestones.length} complete</span></div>{milestones.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Milestone</th><th>Phase</th><th>Status</th><th>Target</th><th>Description</th></tr></thead><tbody>{milestones.map((milestone) => <tr key={milestone.id}><td><strong>{milestone.name}</strong></td><td>{milestone.phase.replaceAll('_', ' ')}</td><td><StatusSignal status={milestone.status} /></td><td className="mono">{formatDate(milestone.target_date)}</td><td>{milestone.description}</td></tr>)}</tbody></table></div> : <p className="muted">No milestones recorded.</p>}</section>
    <section className="panel table-panel"><div className="panel-heading"><div><span>Decision log</span><small>Human-owned choices and rationale</small></div><span className="panel-count">{visibleDecisions.length} decisions</span></div>{visibleDecisions.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Decision</th><th>Type</th><th>Decision maker</th><th>Outcome</th><th>Client visible</th></tr></thead><tbody>{visibleDecisions.map((decision) => <tr key={decision.id}><td><strong>{decision.title}</strong><small>{decision.description}</small></td><td><StatusBadge status={decision.decision_type} /></td><td>{decision.decision_maker?.name || '—'}</td><td><StatusSignal status={decision.outcome} /></td><td>{decision.client_visible ? 'Yes' : 'Internal'}</td></tr>)}</tbody></table></div> : <p className="muted">No decisions are visible in this audience.</p>}</section>
    <section className="panel"><div className="panel-heading"><span>Launch checklist</span><small>Post-launch stability evidence</small></div><div className="checklist">{['Store monitoring active', 'Backup and rollback verified', 'Client training completed', 'Maintenance runbook handed over', 'Post-launch review scheduled'].map((item, index) => <button className="checklist-row" key={item} onClick={() => setOpenChecklist((current) => ({ ...current, [index]: !current[index] }))}><span className={`check-box${openChecklist[index] ? ' is-checked' : ''}`}>{openChecklist[index] && <Check size={13} />}</span><span>{item}</span>{openChecklist[index] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>)}</div></section>
  </div>;
}
