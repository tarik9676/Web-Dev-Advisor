import { normalizeStatus, statusLabel } from '../utils/helpers.js';

const COLORS = {
  high: ['var(--red)', 'var(--red-dim)'],
  critical: ['var(--red)', 'var(--red-dim)'],
  medium: ['var(--amber)', 'var(--amber-dim)'],
  low: ['var(--text-muted)', 'var(--bg-surface)'],
  pending: ['var(--amber)', 'var(--amber-dim)'],
  approved: ['var(--green)', 'var(--green-dim)'],
  blocked: ['var(--red)', 'var(--red-dim)'],
};

export default function StatusBadge({ status }) {
  const normalized = normalizeStatus(status);
  const [color, background] = COLORS[normalized] || COLORS.medium;
  return <span className="status-badge" style={{ color, background }}>{statusLabel(status)}</span>;
}
