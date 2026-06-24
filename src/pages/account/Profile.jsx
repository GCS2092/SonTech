import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone } from 'lucide-react';
import { authApi } from '../../api/auth.api';
import { usersApi } from '../../api/users.api';
import useAuthStore from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

const schema = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  phone:     z.string().optional(),
});

export default function Profile() {
  const { user, updateUser } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => authApi.me().then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName,
        lastName:  profile.lastName,
        phone:     profile.phone || '',
      });
    }
  }, [profile, reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => usersApi.update(data),
    onSuccess: (res) => {
      updateUser(res.data);
      queryClient.invalidateQueries(['profile']);
      toast.success('Profil mis à jour !');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const initials = [user?.firstName?.[0], user?.lastName?.[0]]
    .filter(Boolean)
    .join('')
    .toUpperCase() || '?';

  return (
    <div className="space-y-5">

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-stone-100 p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-500 font-bold text-xl flex items-center justify-center shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-lg font-bold text-stone-800">
            {user?.firstName} {user?.lastName}
          </h1>
          <p className="text-sm text-stone-400">{user?.email}</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-2xl border border-stone-100 p-6">
        <h2 className="text-sm font-semibold text-stone-700 flex items-center gap-2 mb-5">
          <User size={15} className="text-rose-400" />
          Informations personnelles
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Nom"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="relative">
            <Input
              label="Email"
              value={user?.email || ''}
              disabled
              hint="L'email ne peut pas être modifié"
              icon={<Mail size={14} className="text-stone-300" />}
            />
          </div>

          <Input
            label="Téléphone"
            placeholder="+221 77 000 00 00"
            icon={<Phone size={14} className="text-stone-400" />}
            {...register('phone')}
          />
        </div>

        <div className="pt-5 mt-1 border-t border-stone-100 flex justify-end">
          <Button loading={isPending} onClick={handleSubmit(mutate)}>
            Sauvegarder les modifications
          </Button>
        </div>
      </div>

    </div>
  );
}