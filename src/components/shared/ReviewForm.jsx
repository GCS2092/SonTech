import { useState } from 'react';
import { Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi } from '../../api/reviews.api';
import { toast } from 'sonner';
import Button from '../ui/Button';

const schema = z.object({
  comment: z.string().optional(),
});

export default function ReviewForm({ productId, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm({ resolver: zodResolver(schema) });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => reviewsApi.create({ productId, rating, ...data }),
    onSuccess: () => {
      toast.success('Avis publié !');
      reset();
      setRating(0);
      queryClient.invalidateQueries(['reviews', productId]);
      onSuccess?.();
    },
    onError: (err) => toast.error(err.message || 'Erreur lors de la publication'),
  });

  const onSubmit = (data) => {
    if (rating === 0) return toast.error('Veuillez sélectionner une note');
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="bg-stone-50 rounded-2xl p-4 space-y-3">
      <p className="font-medium text-stone-800 text-sm">Laisser un avis</p>

      <div className="flex gap-1">
        {Array.from({ length: 5 }, (_, i) => i + 1).map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
          >
            <Star
              size={22}
              className={star <= (hovered || rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}
            />
          </button>
        ))}
      </div>

      <textarea
        {...register('comment')}
        rows={3}
        placeholder="Votre commentaire (optionnel)"
        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-800 placeholder-stone-400 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 resize-none"
      />

      <Button type="submit" loading={isPending} size="sm">
        Publier l'avis
      </Button>
    </form>
  );
}
