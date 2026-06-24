import { Outlet, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import BottomNav from './BottomNav';
import useAuthStore from '../../store/authStore';
import PWAInstallBanner from '../PWAInstallBanner';

export default function ShopLayout() {
  const { user, isAuthenticated } = useAuthStore();

  if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'STAFF')) {
    return <Navigate to="/admin" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <Navbar />
      {/*
        pb-20 = hauteur BottomNav seule (pages normales)
        Sur ProductDetail, le composant lui-même gère pb-36 pour le CTA sticky
      */}
      <main className="flex-1 pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <PWAInstallBanner />
      <BottomNav />
    </div>
  );
}