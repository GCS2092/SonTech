import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import StoreSwitcher from './StoreSwitcher';

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-stone-950">
      <AdminSidebar />
      <main className="flex-1 min-w-0 overflow-auto bg-stone-50 lg:rounded-tl-2xl lg:rounded-bl-2xl">
        {/* Barre de contexte boutique */}
        <div className="sticky top-0 z-20 border-b border-stone-100 px-4 sm:px-6 py-2.5 flex justify-end bg-white/90 backdrop-blur-sm">
          <StoreSwitcher />
        </div>
        <Outlet />
      </main>
    </div>
  );
}