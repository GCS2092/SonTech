import { clsx } from 'clsx';

const variants = {
  default: 'bg-stone-100 text-stone-600',
  rose: 'bg-rose-100 text-rose-600',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-700',
  blue: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
  red: 'bg-red-100 text-red-600',
  indigo: 'bg-indigo-100 text-indigo-700',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
