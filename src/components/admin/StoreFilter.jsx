import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';

export default function StoreFilter({ value, onChange, className = '' }) {
  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get('/api/admin/stores').then((r) => r.data),
  });

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={isLoading}
      className={`px-3 py-2 rounded-xl border border-stone-200 text-sm bg-white outline-none focus:ring-2 focus:ring-rose-300 ${className}`}
    >
      <option value="">Toutes les boutiques</option>
      {stores.map((store) => (
        <option key={store.id} value={store.id}>
          {store.name} ({store.code}){store.isMain ? ' — Siège' : ''}
        </option>
      ))}
    </select>
  );
}