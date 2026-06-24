import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, MapPin, Home, Building2, Edit2, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addressesApi } from '../../api/addresses.api';
import Modal from '../../components/ui/Modal';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/shared/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'sonner';

const schema = z.object({
  label:    z.string().min(1, 'Libellé requis'),
  fullName: z.string().min(2, 'Nom requis'),
  phone:    z.string().min(6, 'Téléphone requis'),
  street:   z.string().min(3, 'Adresse requise'),
  city:     z.string().min(2, 'Ville requise'),
  country:  z.string().min(2, 'Pays requis'),
});

const LABEL_ICONS = {
  maison:  Home,
  domicile: Home,
  bureau:  Building2,
  default: MapPin,
};

function getLabelIcon(label = '') {
  const key = label.toLowerCase();
  return LABEL_ICONS[key] || LABEL_ICONS.default;
}

export default function Addresses() {
  const [open, setOpen]       = useState(false);
  const [editing, setEditing] = useState(null);
  const queryClient           = useQueryClient();

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAll().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { country: 'Sénégal' },
  });

  const openAdd = () => {
    setEditing(null);
    reset({ country: 'Sénégal' });
    setOpen(true);
  };

  const openEdit = (addr) => {
    setEditing(addr);
    reset(addr);
    setOpen(true);
  };

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data) =>
      editing ? addressesApi.update(editing.id, data) : addressesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success(editing ? 'Adresse modifiée' : 'Adresse ajoutée');
      setOpen(false);
    },
    onError: () => toast.error('Une erreur est survenue'),
  });

  const { mutate: del } = useMutation({
    mutationFn: (id) => addressesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['addresses']);
      toast.success('Adresse supprimée');
    },
    onError: () => toast.error('Impossible de supprimer'),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-stone-800">Mes adresses</h1>
          <p className="text-sm text-stone-400 mt-0.5">
            {addresses?.length
              ? `${addresses.length} adresse${addresses.length > 1 ? 's' : ''} enregistrée${addresses.length > 1 ? 's' : ''}`
              : 'Aucune adresse enregistrée'}
          </p>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus size={14} /> Ajouter
        </Button>
      </div>

      {/* List */}
      {!addresses?.length ? (
        <EmptyState
          icon="📍"
          title="Aucune adresse"
          description="Ajoutez une adresse de livraison pour passer commande plus vite"
          action={
            <Button onClick={openAdd}>
              <Plus size={14} /> Ajouter une adresse
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {addresses.map((addr) => {
            const LabelIcon = getLabelIcon(addr.label);
            return (
              <div
                key={addr.id}
                className="bg-white rounded-2xl border border-stone-100 p-5 flex items-start justify-between gap-4 group"
              >
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <LabelIcon size={16} />
                  </div>
                  <div>
                    <span className="inline-block bg-rose-50 text-rose-500 text-[11px] font-semibold rounded-lg px-2 py-0.5 mb-2">
                      {addr.label}
                    </span>
                    <p className="text-sm font-semibold text-stone-800">{addr.fullName}</p>
                    <p className="text-sm text-stone-500 mt-0.5">{addr.phone}</p>
                    <p className="text-sm text-stone-500">{addr.street}</p>
                    <p className="text-sm text-stone-500">
                      {addr.city}, {addr.country}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(addr)}
                    className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors"
                    aria-label="Modifier"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => del(addr.id)}
                    className="w-8 h-8 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 hover:border-red-100 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Add button */}
          <button
            onClick={openAdd}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-dashed border-stone-200 text-sm text-stone-400 hover:border-rose-300 hover:text-rose-400 hover:bg-rose-50 transition-all"
          >
            <Plus size={15} /> Ajouter une adresse
          </button>
        </div>
      )}

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Modifier l'adresse" : 'Nouvelle adresse'}
      >
        <div className="space-y-3">
          <Input
            label="Libellé"
            placeholder="Maison, Bureau…"
            error={errors.label?.message}
            {...register('label')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nom complet"
              error={errors.fullName?.message}
              {...register('fullName')}
            />
            <Input
              label="Téléphone"
              error={errors.phone?.message}
              {...register('phone')}
            />
          </div>
          <Input
            label="Adresse"
            error={errors.street?.message}
            {...register('street')}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Ville"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="Pays"
              error={errors.country?.message}
              {...register('country')}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Annuler
            </Button>
            <Button loading={isPending} onClick={handleSubmit(save)} className="flex-1">
              {editing ? 'Modifier' : 'Ajouter'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}