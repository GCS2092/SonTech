import { Navigate, Outlet } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function AdminOnlyRoute() {
  const { user } = useAuthStore();
  if (user?.role !== 'ADMIN') return <Navigate to="/admin" replace />;
  return <Outlet />;
}