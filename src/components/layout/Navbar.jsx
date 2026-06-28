import { Link, NavLink } from 'react-router-dom';
import { ShoppingBag, Heart, Bell, User, Menu, X, Tag, Cpu } from 'lucide-react';
import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useUiStore from '../../store/uiStore';
import { useAuth } from '../../context/AuthContext';
import { couponsApi } from '../../api/coupons.api';
import { STORE_ID } from '../../utils/constants';

export default function Navbar() {
  const { isAuthenticated, user, token } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const { mobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore();
  const { logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [promoCoupons, setPromoCoupons] = useState([]);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  const navLinks = [
    { to: '/', label: 'Accueil' },
    { to: '/products', label: 'Boutique' },
  ];

  useEffect(() => {
    couponsApi.getPublic(STORE_ID)
      .then(res => setPromoCoupons(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (promoCoupons.length <= 1) return;
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentPromoIndex(i => (i + 1) % promoCoupons.length);
        setVisible(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [promoCoupons]);

  const currentPromo = promoCoupons[currentPromoIndex];

  const formatPromo = (coupon) => {
    const reduction = coupon.type === 'PERCENTAGE'
      ? `-${coupon.value}%`
      : `-${coupon.value} FCFA`;
    const min = coupon.minOrderAmount
      ? ` dès ${coupon.minOrderAmount} FCFA`
      : '';
    return `🎁 ${coupon.code} • ${reduction}${min}`;
  };

  const formatExpiry = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-xl bg-stone-900 flex items-center justify-center">
              <ShoppingBag size={16} className="text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900">
              Son<span className="text-stone-500">Shop</span>
            </span>
          </Link>

          {/* Bannière promo — entre logo et hamburger, mobile + desktop */}
          {currentPromo && (
            <div className="flex-1 flex justify-center px-2">
              <div
                style={{
                  opacity: visible ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                  background: 'linear-gradient(90deg, #fff1f2, #ffe4e6)',
                  border: '1px solid #fda4af',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  maxWidth: '240px',
                  animation: 'promoPulse 2.5s ease-in-out infinite',
                }}
              >
                <Tag size={11} color="#e11d48" style={{ flexShrink: 0 }} />
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#be123c',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {formatPromo(currentPromo)}
                </span>
                {currentPromo.expiresAt && (
                  <span style={{ fontSize: '10px', color: '#e11d48', opacity: 0.7, flexShrink: 0 }}>
                    · {formatExpiry(currentPromo.expiresAt)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">

            {/* Lien SonTech — desktop */}
            <a
              href={isAuthenticated && token ? `https://son-tech.vercel.app?token=${token}` : "https://son-tech.vercel.app"}
  target="_blank"
  rel="noopener noreferrer"
  className="hidden md:flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 font-medium transition-colors mr-1"
>
  🔌 SonTech
</a>

            {/* Panier — desktop seulement */}
            <Link
              to="/cart"
              className="relative p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors hidden md:block"
            >
              <ShoppingBag size={20} />
              {getTotalItems() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-stone-900 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* Wishlist — desktop */}
                <Link
                  to="/account/wishlist"
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors hidden md:block"
                >
                  <Heart size={20} />
                </Link>

                {/* Notifications — desktop */}
                <Link
                  to="/account/notifications"
                  className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors hidden md:block"
                >
                  <Bell size={20} />
                </Link>

                {/* Profil dropdown — desktop */}
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-stone-100 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center text-white font-semibold text-sm">
                      {user?.firstName?.[0]?.toUpperCase()}
                    </div>
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-stone-100">
                          <p className="font-semibold text-stone-800 text-sm">
                            {user?.firstName} {user?.lastName}
                          </p>
                          <p className="text-xs text-stone-400">{user?.email}</p>
                        </div>
                        <Link to="/account/profile" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                          <User size={15} /> Mon profil
                        </Link>
                        <Link to="/orders" onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                          <ShoppingBag size={15} /> Mes commandes
                        </Link>
                        {user?.role === 'ADMIN' && (
                          <Link to="/admin" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-stone-900 font-medium hover:bg-stone-50 transition-colors">
                            Dashboard Admin
                          </Link>
                        )}
                        <button
                          onClick={() => { setProfileOpen(false); logout(); }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
                        >
                          Déconnexion
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center gap-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
              >
                <User size={15} /> Connexion
              </Link>
            )}

            {/* Hamburger mobile */}
            <button
              className="md:hidden p-2 text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
              onClick={mobileMenuOpen ? closeMobileMenu : openMobileMenu}
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-stone-100 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={closeMobileMenu}
                className={({ isActive }) =>
                  `text-sm font-medium px-3 py-2.5 rounded-xl transition-colors ${
                    isActive ? 'text-stone-900 bg-stone-100' : 'text-stone-600 hover:bg-stone-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            {/* Lien SonTech — mobile */}
            <a
            href={isAuthenticated && token ? `https://son-tech.vercel.app?token=${token}` : "https://son-tech.vercel.app"}
  target="_blank"
  rel="noopener noreferrer"
  className="text-sm font-medium px-3 py-2.5 rounded-xl text-blue-500 hover:bg-blue-50 transition-colors"
>
  🔌 Découvrir SonTech
</a>
            {isAuthenticated && (
              <>
                <NavLink
                  to="/account/profile"
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `text-sm font-medium px-3 py-2.5 rounded-xl transition-colors ${
                      isActive ? 'text-stone-900 bg-stone-100' : 'text-stone-600 hover:bg-stone-50'
                    }`
                  }
                >
                  Mon profil
                </NavLink>
                <button
                  onClick={() => { closeMobileMenu(); logout(); }}
                  className="text-left text-sm font-medium px-3 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Déconnexion
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes promoPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225, 29, 72, 0.2); }
          50% { box-shadow: 0 0 0 5px rgba(225, 29, 72, 0); }
        }
      `}</style>
    </header>
  );
}