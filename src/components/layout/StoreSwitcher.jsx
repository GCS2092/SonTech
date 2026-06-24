/**
 * StoreSwitcher.jsx
 * Composant de sélection de boutique active pour l'admin.
 * À placer dans AdminLayout ou le header admin.
 *
 * Placement suggéré dans AdminLayout.jsx :
 *   import StoreSwitcher from './StoreSwitcher';
 *   // Dans le JSX :
 *   <div className="flex min-h-screen bg-stone-950">
 *     <AdminSidebar />
 *     <main className="flex-1 min-w-0 overflow-auto bg-stone-50 lg:rounded-tl-2xl lg:rounded-bl-2xl">
 *       <div className="border-b border-stone-100 px-6 py-3 flex justify-end bg-white">
 *         <StoreSwitcher />
 *       </div>
 *       <Outlet />
 *     </main>
 *   </div>
 */
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Store, ChevronDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function StoreSwitcher() {
  const [open, setOpen] = useState(false);
  const { token, setToken } = useAuthStore();

  // Boutique active depuis le token JWT décodé (sans lib externe)
  const payload = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const activeStoreId = payload?.activeStoreId;

  const { data: stores = [] } = useQuery({
    queryKey: ['stores-switcher'],
    queryFn:  () => api.get('/api/admin/stores').then((r) => r.data),
  });

  const activeStore = stores.find((s) => s.id === activeStoreId) || stores.find((s) => s.isMain) || stores[0];

  const switchMutation = useMutation({
    mutationFn: (storeId) => api.post('/api/auth/switch-store', { storeId }).then((r) => r.data),
    onSuccess: (data) => {
      // Met à jour le token avec le nouveau activeStoreId
      setToken(data.token);
      toast.success(`Boutique active : ${data.store.name}`);
      setOpen(false);
      // Reload léger pour que toutes les queries se rafraîchissent avec le bon contexte
      window.location.reload();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur de changement de boutique'),
  });

  if (stores.length <= 1) return null; // Inutile si une seule boutique

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
      >
        <Store size={15} className="text-rose-500" />
        <span>{activeStore?.name || 'Boutique'}</span>
        {activeStore?.isMain && (
          <span className="text-xs bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full">Siège</span>
        )}
        <ChevronDown size={14} className={`text-stone-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 bg-white rounded-2xl border border-stone-100 shadow-xl w-64 overflow-hidden">
            <div className="px-4 py-3 border-b border-stone-100">
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Changer de boutique
              </p>
            </div>
            <div className="py-1">
              {stores.map((store) => {
                const isActive = store.id === activeStore?.id;
                return (
                  <button
                    key={store.id}
                    onClick={() => !isActive && switchMutation.mutate(store.id)}
                    disabled={isActive || switchMutation.isPending}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                      isActive
                        ? 'bg-rose-50 text-rose-700 cursor-default'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                      isActive ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-600'
                    }`}>
                      {store.code?.slice(0, 2)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-medium truncate">{store.name}</p>
                      <p className="text-xs text-stone-400">
                        {store.isMain ? 'Siège · ' : ''}{store.code}
                      </p>
                    </div>
                    {isActive && <Check size={15} className="text-rose-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}