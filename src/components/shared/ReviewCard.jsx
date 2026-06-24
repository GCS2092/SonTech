import { Star } from 'lucide-react';
import { formatRelative } from '../../utils/formatDate';

export default function ReviewCard({ review }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-500 font-semibold text-sm flex items-center justify-center">
            {review.user?.firstName?.[0]?.toUpperCase()}
          </div>
          <span className="text-sm font-medium text-stone-800">
            {review.user?.firstName} {review.user?.lastName}
          </span>
        </div>
        <span className="text-xs text-stone-400">{formatRelative(review.createdAt)}</span>
      </div>

      <div className="flex gap-0.5 mb-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-stone-200'}
          />
        ))}
      </div>

      {review.comment && (
        <p className="text-sm text-stone-600 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
}
