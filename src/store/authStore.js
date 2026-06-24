import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUTH_TOKEN_KEY } from '../utils/constants';

// ✅ Le login OneSignal est géré par useNotifications (AuthContext)
// On garde uniquement le logout pour dissocier l'appareil proprement

async function logoutFromOneSignal() {
  try {
    const OneSignal = (await import('react-onesignal')).default;
    await OneSignal.logout();
    console.log('✅ OneSignal logout');
  } catch (e) {
    console.error('❌ OneSignal logout error:', e);
  }
}

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        set({ user, token, isAuthenticated: true });
        // ❌ Plus de loginToOneSignal ici → c'est useNotifications qui s'en charge
      },

      setToken: (token) => {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        set({ token });
      },

      updateUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        logoutFromOneSignal(); // ✅ On garde le logout OneSignal
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    {
      name: 'urban-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;