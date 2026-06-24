import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { User, MapPin, Bell, Heart, Package, LogOut } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications.api';
import useAuthStore from '../../store/authStore';
import { clsx } from 'clsx';

const navItems = [
  {
    section: 'Mon compte',
    links: [
      { to: '/account/profile',       label: 'Profil',         Icon: User },
      { to: '/account/addresses',     label: 'Adresses',       Icon: MapPin },
      { to: '/account/notifications', label: 'Notifications',  Icon: Bell, badge: true },
      { to: '/account/wishlist',      label: 'Favoris',        Icon: Heart },
    ],
  },
  {
    section: 'Achats',
    links: [
      { to: '/orders', label: 'Commandes', Icon: Package },
    ],
  },
];

export default function AccountLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    staleTime: 30_000,
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">

          {/* ── Sidebar ── */}
          <aside className="w-full md:w-56 shrink-0 md:sticky md:top-8">
            <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">

              {/* Avatar */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-stone-100">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-500 font-semibold text-sm flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-stone-400 truncate">{user?.email}</p>
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                {navItems.map(({ section, links }) => (
                  <div key={section} className="mb-1">
                    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest px-3 py-2">
                      {section}
                    </p>
                    {links.map(({ to, label, Icon, badge }) => (
                      <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                          clsx(
                            'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition-colors w-full',
                            isActive
                              ? 'bg-rose-50 text-rose-600 font-medium'
                              : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon
                              size={15}
                              className={clsx(isActive ? 'text-rose-500' : 'text-stone-400')}
                            />
                            <span className="flex-1">{label}</span>
                            {badge && unreadCount > 0 && (
                              <span className="bg-rose-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 leading-none">
                                {unreadCount}
                              </span>
                            )}
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                ))}

                {/* Logout */}
                <div className="border-t border-stone-100 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-stone-400 hover:bg-red-50 hover:text-red-500 transition-colors w-full"
                  >
                    <LogOut size={15} />
                    Déconnexion
                  </button>
                </div>
              </nav>
            </div>
          </aside>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 w-full">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
}