import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Search, Package, User } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';

export default function BottomNav() {
  const { isAuthenticated } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const location = useLocation();

  // Masquer sur checkout
  const hidden = ['/checkout'].includes(location.pathname);
  if (hidden) return null;

  const navItems = [
    {
      to: '/',
      end: true,
      icon: Home,
      label: 'Accueil',
    },
    {
      to: '/products',
      icon: Search,
      label: 'Boutique',
    },
    {
      to: '/cart',
      icon: ShoppingBag,
      label: 'Panier',
      badge: getTotalItems() > 0 ? getTotalItems() : null,
    },
    ...(isAuthenticated
      ? [
          {
            to: '/orders',
            icon: Package,
            label: 'Commandes',
          },
          {
            to: '/account/profile',
            icon: User,
            label: 'Compte',
          },
        ]
      : [
          {
            to: '/login',
            icon: User,
            label: 'Connexion',
          },
        ]),
  ];

  // Hauteur totale de la BottomNav = pt-2 + pb-3 + icône ~22px + label ~12px + indicateur 6px ≈ 64px
  // On utilise z-30 (sous le CTA sticky de ProductDetail qui est z-40)
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-stone-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-center justify-around px-1 pt-2 pb-3">
        {navItems.map(({ to, end, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[52px] ${
                isActive ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Indicateur actif */}
                <span
                  className={`block w-5 h-0.5 rounded-full mb-1 transition-all ${
                    isActive ? 'bg-stone-900' : 'bg-transparent'
                  }`}
                />
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  {badge && (
                    <span className="absolute -top-1.5 -right-1.5 bg-stone-800 text-white text-[9px] font-bold rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5 leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    isActive ? 'text-stone-900' : 'text-stone-400'
                  }`}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}