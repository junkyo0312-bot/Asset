import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuth } from '../../lib/auth-context';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [timedOut, setTimedOut] = useState(false);

  // Safety timeout: if loading takes too long, redirect to login
  useEffect(() => {
    if (!loading) {
      setTimedOut(false);
      return;
    }

    const timeout = setTimeout(() => {
      console.warn('Auth loading timeout reached (15s) - redirecting to login');
      setTimedOut(true);
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Timeout reached - force redirect
  if (timedOut) {
    return <Navigate to="/login" replace />;
  }

  // Still loading auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm text-gray-500">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Authenticated - render children
  return <>{children}</>;
}
