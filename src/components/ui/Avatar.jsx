import { clsx } from 'clsx';

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export default function Avatar({ name, src, size = 'md', className }) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={clsx('rounded-full object-cover', sizes[size], className)}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full bg-rose-100 text-rose-500 font-semibold flex items-center justify-center',
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
