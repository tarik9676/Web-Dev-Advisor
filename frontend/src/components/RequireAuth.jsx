import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function RequireAuth({ children }) {
  const { isAuthenticated, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="auth-boot">
        <Loader2 size={18} className="spinning" aria-label="Checking your session" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }

  return children;
}
