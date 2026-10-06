import { normalizeStatus, statusLabel } from '../utils/helpers.js';

const STATUS = {
  in_progress: ['var(--green)', 'In Progress', '●'],
  done: ['var(--green)', 'Done', '●'],
  completed: ['var(--green)', 'Completed', '●'],
  not_started: ['var(--text-muted)', 'Not Started', '○'],
  blocked: ['var(--red)', 'Blocked', '●'],
  open: ['var(--amber)', 'Open', '●'],
  mitigating: ['var(--amber)', 'Mitigating', '●'],
  mitigated: ['var(--green)', 'Mitigated', '●'],
  approved: ['var(--green)', 'Approved', '●'],
  pending: ['var(--amber)', 'Pending', '○'],
  closed: ['var(--text-muted)', 'Closed', '○'],
  resolved: ['var(--green)', 'Resolved', '●'],
  rejected: ['var(--red)', 'Rejected', '●'],
  escalated: ['var(--red)', 'Escalated', '●'],
  identified: ['var(--amber)', 'Identified', '●'],
  accepted: ['var(--blue)', 'Accepted', '●'],
  proposed: ['var(--blue)', 'Proposed', '●'],
  superseded: ['var(--text-muted)', 'Superseded', '○'],
};

export default function StatusSignal({ status }) {
  const normalized = normalizeStatus(status);
  const value = STATUS[normalized] || ['var(--text-muted)', statusLabel(status), '●'];
  return (
    <span className="status-signal" style={{ color: value[0] }}>
      <span className="status-dot">{value[2]}</span>
      <span>{value[1]}</span>
    </span>
  );
}
