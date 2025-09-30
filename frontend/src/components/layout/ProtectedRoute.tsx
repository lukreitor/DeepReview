import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuthStore, type AuthState } from '@store/authStore';

export const ProtectedRoute = () => {
  const token = useAuthStore((state: AuthState) => state.token);
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
};
