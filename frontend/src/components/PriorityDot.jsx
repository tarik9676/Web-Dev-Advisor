const LABELS = { high: 'High', critical: 'Critical', medium: 'Medium', low: 'Low' };
const COLORS = { high: 'var(--red)', critical: 'var(--red)', medium: 'var(--amber)', low: 'var(--text-muted)' };

export default function PriorityDot({ priority }) {
  return (
    <span className="priority-dot">
      <span style={{ background: COLORS[priority] || COLORS.medium }} />
      {LABELS[priority] || priority}
    </span>
  );
}
