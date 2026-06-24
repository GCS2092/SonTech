import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications.api';
import useAuthStore from '../../store/authStore';

export default function NotificationBell() {
  const { isAuthenticated } = useAuthStore();

  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const unread = data?.filter((n) => !n.isRead).length || 0;

  return (
    <Link
      to="/account/notifications"
      className="relative p-2 text-stone-600 hover:text-stone-900 transition-colors"
    >
      {/* Cloche avec légère animation si non lues */}
      <Bell
        size={20}
        className={unread > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}
      />

      {unread > 0 && (
        <>
          {/* Halo pulse derrière le badge */}
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-rose-400 opacity-50 animate-ping" />
          {/* Badge principal */}
          <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        </>
      )}
    </Link>
  );
}