import { clsx } from 'clsx';

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

export default function Spinner({ size = 'md', color = 'rose', className }) {
  const colorClass = color === 'current' ? 'border-current border-t-transparent' : 'border-rose-400 border-t-transparent';

  return (
    <div
      className={clsx(
        'rounded-full border-2 animate-spin',
        sizes[size],
        colorClass,
        className
      )}
    />
  );
}
