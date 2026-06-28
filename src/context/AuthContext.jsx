import { createContext, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import useAuthStore from '../store/authStore';
import useCartStore from '../store/cartStore';
import { authApi } from '../api/auth.api';
import { ANONYMOUS_CART_KEY } from '../utils/constants';
import { useNotifications } from '../hooks/useNotifications';
import OneSignal from 'react-onesignal';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { user, token, isAuthenticated, setAuth, logout: storeLogout } = useAuthStore();
  const { fetchCart } = useCartStore();
  const navigate = useNavigate();

  // ✅ Demande permission OneSignal + associe l'user dès qu'il est connecté
  useNotifications();

  // ✅ Auto-login si token passé dans l'URL (depuis UrbanBeauty)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken && !isAuthenticated) {
      // Nettoie l'URL sans recharger la page
      window.history.replaceState({}, '', window.location.pathname);
      // Stocke le token provisoirement et vérifie avec /me
      setAuth(null, urlToken);
      authApi.me()
        .then(({ data }) => {
          setAuth(data, urlToken);
          fetchCart(data.id);
          toast.success(`Bienvenue ${data.firstName} !`);
        })
        .catch(() => {
          storeLogout();
        });
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCart(user.id);
    }
  }, [isAuthenticated]);

  const login = async (credentials) => {
    try {
      const { data } = await authApi.login(credentials);
      const anonymousId = localStorage.getItem(ANONYMOUS_CART_KEY);
      setAuth(data.user, data.token);
      await fetchCart(data.user.id, anonymousId);
      localStorage.removeItem(ANONYMOUS_CART_KEY);
      toast.success(`Bienvenue ${data.user.firstName} !`);
      navigate(data.user.role === 'ADMIN' || data.user.role === 'STAFF' ? '/admin' : '/');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Email ou mot de passe incorrect';
      toast.error(message);
      throw err;
    }
  };

  const register = async (formData) => {
    try {
      await authApi.register(formData);
      toast.success('Compte créé ! Connectez-vous.');
      navigate('/login');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la création du compte';
      toast.error(message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await OneSignal.logout();
    } catch {}
    try { await authApi.logout(); } catch {}
    storeLogout();
    toast.success('À bientôt !');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);