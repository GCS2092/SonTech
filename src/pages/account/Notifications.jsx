import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, CheckCheck, Package, Tag, Star, ShoppingBag } from 'lucide-react';
import { notificationsApi } from '../../api/notifications.api';
import { formatRelative } from '../../utils/formatDate';
import EmptyState from '../../components/shared/EmptyState';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';
import { clsx } from 'clsx';

// --- Couleurs et icônes distinctives par type ---
const TYPE_CONFIG = {
  ORDER: {
    icon: Package,
    colorRead: 'bg-blue-50 text-blue-400',
    colorUnread: 'bg-blue-100 text-blue-600',
  },
  PROMOTION: {
    icon: Tag,
    colorRead: 'bg-amber-50 text-amber-400',
    colorUnread: 'bg-amber-100 text-amber-600',
  },
  NEW_PRODUCT: {
    icon: Star,
    colorRead: 'bg-purple-50 text-purple-400',
    colorUnread: 'bg-purple-100 text-purple-600',
  },
  DELIVERY: {
    icon: ShoppingBag,
    colorRead: 'bg-green-50 text-green-400',
    colorUnread: 'bg-green-100 text-green-600',
  },
  default: {
    icon: Bell,
    colorRead: 'bg-stone-100 text-stone-400',
    colorUnread: 'bg-rose-100 text-rose-500',
  },
};

function getConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.default;
}

// --- Groupement par date ---
function groupByDate(notifications) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const groups = { "Aujourd'hui": [], 'Cette semaine': [], 'Plus ancien': [] };

  notifications.forEach((n) => {
    const date = new Date(n.createdAt);
    if (date >= today) {
      groups["Aujourd'hui"].push(n);
    } else if (date >= weekAgo) {
      groups['Cette semaine'].push(n);
    } else {
      groups['Plus ancien'].push(n);
    }
  });

  // Ne retourner que les groupes non vides
  return Object.entries(groups).filter(([, items]) => items.length > 0);
}

// --- Skeleton loader ---
function NotificationSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-2xl border border-stone-100 bg-white">
          <div className="w-9 h-9 rounded-xl bg-stone-100 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <div className="h-3.5 bg-stone-100 rounded-full animate-pulse w-2/3" />
            <div className="h-3 bg-stone-100 rounded-full animate-pulse w-full" />
            <div className="h-3 bg-stone-100 rounded-full animate-pulse w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries(['notifications']);

  const { mutate: markRead } = useMutation({
    mutationFn: (id) => notificationsApi.markAsRead(id),
    onSuccess: invalidate,
  });

  const { mutate: markAll } = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      invalidate();
      toast.success('Toutes les notifications sont lues');
    },
  });

  const { mutate: del } = useMutation({
    mutationFn: (id) => notificationsApi.delete(id),
    onSuccess: () => {
      invalidate();
      toast.success('Notification supprimée');
    },
  });

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;
  const groups = notifications ? groupByDate(notifications) : [];

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Notifications</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {isLoading
              ? '...'
              : unreadCount > 0
              ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Tout est lu'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => markAll()}>
            <CheckCheck size={14} /> Tout marquer lu
          </Button>
        )}
      </div>

      {/* Skeleton */}
      {isLoading && <NotificationSkeleton />}

      {/* Empty */}
      {!isLoading && !notifications?.length && (
        <EmptyState
          icon="🔔"
          title="Aucune notification"
          description="Vous êtes à jour !"
        />
      )}

      {/* Liste groupée par date */}
      {!isLoading && groups.map(([label, items]) => (
        <div key={label}>
          {/* Séparateur de groupe */}
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{label}</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>

          <div className="space-y-2">
            {items.map((notif) => {
              const config = getConfig(notif.type);
              const Icon = config.icon;
              return (
                <div
                  key={notif.id}
                  onClick={() => !notif.isRead && markRead(notif.id)}
                  className={clsx(
                    'flex gap-3 p-4 rounded-2xl border transition-all cursor-pointer group',
                    notif.isRead
                      ? 'bg-white border-stone-100 hover:border-stone-200'
                      : 'bg-rose-50/40 border-rose-100 hover:bg-rose-50'
                  )}
                >
                  {/* Icône colorée selon le type */}
                  <div className={clsx(
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    notif.isRead ? config.colorRead : config.colorUnread
                  )}>
                    <Icon size={16} />
                  </div>

                  {/* Contenu */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={clsx(
                        'text-sm font-semibold leading-snug',
                        notif.isRead ? 'text-stone-500' : 'text-stone-800'
                      )}>
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1 ring-2 ring-rose-100" />
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-xs text-stone-300 mt-1">
                      {formatRelative(notif.createdAt)}
                    </p>
                  </div>

                  {/* Bouton supprimer — toujours visible sur mobile, hover sur desktop */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      del(notif.id);
                    }}
                    aria-label="Supprimer"
                    className="p-1.5 rounded-lg
                               opacity-100 md:opacity-0 md:group-hover:opacity-100
                               hover:bg-red-50 text-stone-300 hover:text-red-400
                               transition-all shrink-0 self-start mt-0.5"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}

    </div>
  );
}