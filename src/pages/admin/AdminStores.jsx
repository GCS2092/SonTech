import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Store, Plus, Save } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const emptyForm = {
  code: '',
  name: '',
  address: '',
  phone: '',
  taxRate: 0,
  discountRate: 0,
  currency: 'XOF',
  isMain: false,
};

export default function AdminStores() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: stores = [], isLoading } = useQuery({
    queryKey: ['admin-stores'],
    queryFn: () => api.get('/api/admin/stores').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/admin/stores', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      setForm(emptyForm);
      toast.success('Boutique créée');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/api/admin/stores/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-stores'] });
      setEditingId(null);
      toast.success('Boutique mise à jour');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Erreur'),
  });

  const startEdit = (store) => {
    setEditingId(store.id);
    setEditForm({
      name: store.name,
      address: store.address || '',
      phone: store.phone || '',
      taxRate: store.taxRate,
      discountRate: store.discountRate,
      currency: store.currency,
      isActive: store.isActive,
      isMain: store.isMain,
    });
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-rose-500 flex items-center justify-center">
          <Store size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Boutiques</h1>
          <p className="text-sm text-stone-500">Gestion multi-boutiques — stock central partagé</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-8">
        <h2 className="font-semibold text-stone-800 mb-4 flex items-center gap-2">
          <Plus size={16} /> Nouvelle boutique
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Code (ex: BTA)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          <Input label="Nom" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <Input label="Adresse" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          <Input label="Téléphone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Taxe (%)" type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })} />
          <Input label="Remise boutique (%)" type="number" value={form.discountRate} onChange={(e) => setForm({ ...form, discountRate: Number(e.target.value) })} />
        </div>
        <label className="flex items-center gap-2 mt-3 text-sm text-stone-600">
          <input type="checkbox" checked={form.isMain} onChange={(e) => setForm({ ...form, isMain: e.target.checked })} />
          Boutique principale (siège)
        </label>
        <Button className="mt-4" loading={createMutation.isPending} onClick={() => createMutation.mutate(form)}>
          Créer la boutique
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <p className="text-stone-400 text-sm">Chargement...</p>
        ) : stores.map((store) => (
          <div key={store.id} className="bg-white rounded-2xl border border-stone-200 p-5">
            {editingId === store.id ? (
              <div className="space-y-3">
                <Input label="Nom" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Taxe (%)" type="number" value={editForm.taxRate} onChange={(e) => setEditForm({ ...editForm, taxRate: Number(e.target.value) })} />
                  <Input label="Remise (%)" type="number" value={editForm.discountRate} onChange={(e) => setEditForm({ ...editForm, discountRate: Number(e.target.value) })} />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.isMain} onChange={(e) => setEditForm({ ...editForm, isMain: e.target.checked })} />
                    Siège
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={editForm.isActive} onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate({ id: store.id, data: editForm })}>
                    <Save size={14} className="mr-1" /> Enregistrer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Annuler</Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900">{store.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">{store.code}</span>
                    {store.isMain && <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-600">Siège</span>}
                    {!store.isActive && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600">Inactive</span>}
                  </div>
                  <p className="text-sm text-stone-500 mt-1">{store.address || '—'}</p>
                  <p className="text-xs text-stone-400 mt-2">
                    Taxe {store.taxRate}% · Remise {store.discountRate}% · {store.currency}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => startEdit(store)}>Modifier</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
