import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAuthModal } from '../../context/AuthModalContext';
import { PageSpinner } from '../ui/Spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { openAuthModal } = useAuthModal();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', { replace: true, state: { from: location } });
      openAuthModal({ defaultTab: 'login' });
    }
  }, [loading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <PageSpinner />;
  if (!user) return <PageSpinner />;
  return <>{children}</>;
}

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
