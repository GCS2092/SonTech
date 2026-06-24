import { useEffect, useRef } from 'react';
import OneSignal from 'react-onesignal';
import useAuthStore from '../store/authStore';

/**
 * Hook à appeler UNE SEULE FOIS dans AuthContext après login.
 * - Demande la permission push si pas encore accordée
 * - Associe l'utilisateur connecté à son Player ID OneSignal
 */
export function useNotifications() {
  const { user, isAuthenticated } = useAuthStore();
  const asked = useRef(false);

  // ✅ Reset si déconnexion ou changement d'utilisateur
  useEffect(() => {
    if (!isAuthenticated) asked.current = false;
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id || asked.current) return;

    async function setup() {
      try {
        // 1️⃣ Attendre que OneSignal soit vraiment prêt
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 2️⃣ Demande la permission si pas encore accordée
        const permission = OneSignal.Notifications.permission;
        if (!permission) {
          await OneSignal.Notifications.requestPermission();
        }

        // 3️⃣ Vérifier que la permission est bien accordée
        const granted = OneSignal.Notifications.permission;
        if (!granted) {
          console.warn('OneSignal: permission refusée, pas de login');
          return; // asked.current reste false → réessai possible
        }

        // 4️⃣ Associer l'utilisateur
        await OneSignal.login(String(user.id));

        asked.current = true; // ✅ Seulement si tout a réussi
        console.log('✅ OneSignal: utilisateur associé', user.id);
      } catch (err) {
        console.error('OneSignal setup error:', err);
        // asked.current reste false → réessai au prochain render
      }
    }

    setup();
  }, [isAuthenticated, user?.id]);
}