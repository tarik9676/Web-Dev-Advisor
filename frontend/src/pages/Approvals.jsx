import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Plus, ShieldCheck, X } from 'lucide-react';
import { api } from '../api/client.js';
import { useApp } from '../context/AppContext.jsx';
import StatusSignal from '../components/StatusSignal.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import { SkeletonTable } from '../components/Skeleton.jsx';
import EmptyState from '../components/EmptyState.jsx';
import ErrorState from '../components/ErrorState.jsx';
import Modal from '../components/Modal.jsx';
import { memberName, projectName } from '../utils/helpers.js';

const DECISION_TYPES = ['client_facing', 'financial', 'security', 'production', 'scope'];

function ApprovalForm({ project, approval, onClose, onSaved }) {
  const { showToast } = useApp();
  const humans = (project?.team_members || []).filter((member) => member.kind === 'human');
  const [form, setForm] = useState({
    name: approval?.name || '',
    description: approval?.description || '',
    decision_type: approval?.decision_type || 'client_facing',
    approver_id: approval?.approver?.id || humans[0]?.id || '',
    required: approval?.required ?? true,
    status: approval?.status || 'pending',
    notes: approval?.notes || '',
  });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.approver_id) return;
    try {
      if (approval) {
        await api.patch(`/projects/${project.id}/approval-gates/${approval.id}/`, form);
        showToast('Approval gate updated', 'success');
      } else {
        await api.post(`/projects/${project.id}/approval-gates/`, form);
        showToast('Approval gate added', 'success');
      }
      onSaved();
    } catch {
      showToast('Approval gate update failed', 'error');
    }
  };
  return <Modal title={approval ? 'Edit approval gate' : 'Add approval gate'} onClose={onClose}>
    <form className="form-grid" onSubmit={submit}>
      <label>Name<input value={form.name} onChange={(event) => update('name', event.target.value)} required autoFocus /></label>
      <label>Decision type<select value={form.decision_type} onChange={(event) => update('decision_type', event.target.value)}>{DECISION_TYPES.map((type) => <option value={type} key={type}>{type.replaceAll('_', ' ')}</option>)}</select></label>
      <label>Human approver<select value={form.approver_id} onChange={(event) => update('approver_id', event.target.value)} required>{humans.map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</select></label>
      <label>Status<select value={form.status} onChange={(event) => update('status', event.target.value)}>{['pending', 'approved', 'rejected', 'escalated'].map((status) => <option value={status} key={status}>{status}</option>)}</select></label>
      <label>Description<textarea rows="3" value={form.description} onChange={(event) => update('description', event.target.value)} /></label>
      <label>Notes<textarea rows="3" value={form.notes} onChange={(event) => update('notes', event.target.value)} /></label>
      <label className="check-row">Required<input type="checkbox" checked={form.required} onChange={(event) => update('required', event.target.checked)} /></label>
      <div className="form-actions"><button type="button" className="button secondary" onClick={onClose}>Cancel</button><button className="button primary"><ShieldCheck size={14} /> Save gate</button></div>
    </form>
  </Modal>;
}

export default function Approvals() {
  const { projectId, audience, loadProject, loadApprovals, showToast } = useApp();
  const [project, setProject] = useState(null);
  const [approvals, setApprovals] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirming, setConfirming] = useState(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true); setError(null);
    try {
      const [projectData, approvalData] = await Promise.all([loadProject(projectId), loadApprovals(projectId)]);
      setProject(projectData);
      setApprovals(Array.isArray(approvalData) ? approvalData : approvalData.approval_gates || approvalData.approvals || []);
    } catch (caught) { setError(caught); } finally { setLoading(false); }
  }, [projectId, audience, loadProject, loadApprovals]);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => audience === 'client' ? (approvals || []).filter((item) => ['client_facing', 'scope'].includes(item.decision_type)) : (approvals || []), [approvals, audience]);
  const save = () => { setEditing(null); setCreating(false); load(); };
  const updateStatus = async (approval, status) => {
    try {
      await api.patch(`/projects/${project.id}/approval-gates/${approval.id}/`, { status });
      setApprovals((current) => current.map((item) => item.id === approval.id ? { ...item, status } : item));
      setConfirming(null);
      showToast(`${approval.name} marked ${status}`, 'success');
    } catch { showToast('Approval update failed', 'error'); }
  };

  if (error) return <ErrorState message="Failed to load approval gates" onRetry={load} />;
  if (loading || !approvals) return <div className="page-loading"><SkeletonTable rows={6} /></div>;
  return <div className="page">
    <header className="page-heading"><div><div className="eyebrow">Governance / human approval</div><h1>{projectName(project)}</h1><p>Client-facing, financial, security, production, and scope decisions require a named human approver.</p></div><button className="button primary" onClick={() => setCreating(true)}><Plus size={15} /> Add gate</button></header>
    <section className="approval-summary"><div><strong>{visible.filter((item) => item.status === 'pending').length}</strong><span>Pending</span></div><div><strong>{visible.filter((item) => item.status === 'approved').length}</strong><span>Approved</span></div><div><strong>{visible.filter((item) => item.status === 'rejected').length}</strong><span>Rejected</span></div><div><strong>{visible.filter((item) => item.status === 'escalated').length}</strong><span>Escalated</span></div></section>
    <section className="panel table-panel"><div className="panel-heading"><div><span>Approval gates</span><small>{audience === 'client' ? 'Client-facing decisions' : 'All governance decisions'}</small></div><span className="panel-count">{visible.length} gates</span></div>
      {visible.length ? <div className="table-scroll"><table className="data-table"><thead><tr><th>Gate</th><th>Type</th><th>Approver</th><th>Status</th><th>Required</th><th>Decision</th><th /></tr></thead><tbody>
        {visible.map((approval) => <tr key={approval.id}><td><strong>{approval.name}</strong><small>{approval.description}</small></td><td><StatusBadge status={approval.decision_type} /></td><td>{memberName(approval.approver)}</td><td><StatusSignal status={approval.status} /></td><td>{approval.required ? 'Yes' : 'No'}</td><td><div className="inline-actions">{approval.status !== 'approved' && <button onClick={() => setConfirming({ approval, status: 'approved' })}><Check size={13} /> Approve</button>}{approval.status !== 'rejected' && <button onClick={() => setConfirming({ approval, status: 'rejected' })}><X size={13} /> Reject</button>}</div></td><td><button onClick={() => setEditing(approval)}>Edit</button></td></tr>)}
      </tbody></table></div> : <EmptyState message="No approval gates are visible" />}
    </section>
    {(creating || editing) && <ApprovalForm project={project} approval={editing} onClose={() => { setCreating(false); setEditing(null); }} onSaved={save} />}
    {confirming && <Modal title="Confirm approval decision" onClose={() => setConfirming(null)} width={420}><div className="confirm-copy"><ShieldCheck size={28} /><strong>{confirming.approval.name}</strong><p>Record this gate as <b>{confirming.status}</b>? The decision is attributed to the named human approver.</p><div className="form-actions"><button className="button secondary" onClick={() => setConfirming(null)}>Cancel</button><button className="button primary" onClick={() => updateStatus(confirming.approval, confirming.status)}>Confirm</button></div></div></Modal>}
  </div>;
}
