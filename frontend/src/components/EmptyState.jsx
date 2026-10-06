import { RefreshCw } from 'lucide-react';

export default function EmptyState({ message = 'No items yet', action }) {
  return (
    <div className="state-panel">
      <span className="empty-mark">∅</span>
      <span>{message}</span>
      {action && <button className="button secondary" onClick={action.onClick}><RefreshCw size={13} /> {action.label}</button>}
    </div>
  );
}
