import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="state-panel error-state" role="alert">
      <AlertCircle size={26} />
      <strong>{message}</strong>
      {onRetry && <button className="button secondary" onClick={onRetry}><RefreshCw size={13} /> Retry</button>}
    </div>
  );
}
