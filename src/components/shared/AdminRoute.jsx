import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminRoute() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  // ✅ ADMIN et STAFF ont accès
  if (user?.role !== 'ADMIN' && user?.role !== 'STAFF') return <Navigate to="/" replace />;
  return <Outlet />;
}