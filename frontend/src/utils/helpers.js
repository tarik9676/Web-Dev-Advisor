export const STATUS_LABELS = {
  not_started: 'Not Started',
  blocked: 'Blocked',
  in_progress: 'In Progress',
  internal_review: 'Internal Review',
  client_review: 'Client Review',
  approved: 'Approved',
  done: 'Done',
  completed: 'Completed',
  pending: 'Pending',
  rejected: 'Rejected',
  escalated: 'Escalated',
  identified: 'Identified',
  mitigating: 'Mitigating',
  resolved: 'Resolved',
  accepted: 'Accepted',
  proposed: 'Proposed',
  superseded: 'Superseded',
  open: 'Open',
  closed: 'Closed',
};

export function normalizeStatus(value) {
  if (!value) return 'not_started';
  return String(value).replaceAll('-', '_');
}

export function statusLabel(value) {
  return STATUS_LABELS[value] || STATUS_LABELS[value?.replaceAll('-', '_')] || String(value || '—');
}

export function memberName(member) {
  if (!member) return '—';
  if (typeof member === 'string') return member;
  return member?.name || member?.label || '—';
}

export function projectName(project) {
  return project?.project_name || project?.name || 'Project';
}

export function projectCode(project) {
  return project?.code || project?.slug || '';
}

export function getResults(data) {
  if (Array.isArray(data)) return data;
  return data?.results || [];
}

export function workstreamOwner(workstream) {
  return memberName(workstream?.human_owner || workstream?.owner);
}

export function workstreamAiNames(workstream) {
  const items = workstream?.ai_assistants || workstream?.aiAssistants || [];
  if (!items.length) return 'None';
  return items.map(memberName).join(', ');
}

export function workstreamTaskCounts(workstream, tasks) {
  const list = tasks?.filter((task) => Number(task.workstream) === Number(workstream.id) || task.workstream_id === workstream.id) || [];
  return {
    total: list.length,
    completed: list.filter((task) => task.status === 'done' || task.status === 'completed').length,
  };
}

export function dependencyNames(ids, workstreams) {
  if (!ids?.length) return 'None';
  return ids.map((id) => workstreams?.find((item) => Number(item.id) === Number(id))?.name || id).join(', ');
}

export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function currentPhase(milestones) {
  const active = milestones?.find((milestone) => milestone.status === 'in_progress');
  if (active) return active.phase;
  const pending = milestones?.find((milestone) => milestone.status !== 'completed' && milestone.status !== 'skipped');
  return pending?.phase || 'build';
}

export function currencyValue(value, currency = 'USD') {
  if (value === null || value === undefined || value === '') return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
}
