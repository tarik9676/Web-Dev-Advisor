import { useEffect } from 'react';
import { useApp } from '../context/AppContext.jsx';

export default function Toast() {
  const { toasts } = useApp();
  if (!toasts.length) return null;
  return (
    <div className="toast-region" role="status" aria-live="polite">
      {toasts.map((toast) => <div className={`toast toast-${toast.kind}`} key={toast.id}>{toast.message}</div>)}
    </div>
  );
}
