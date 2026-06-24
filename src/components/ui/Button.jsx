import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

const cn = (...args) => twMerge(clsx(...args));

const variants = {
  primary: 'bg-rose-500 hover:bg-rose-600 text-white shadow-sm',
  secondary: 'bg-stone-100 hover:bg-stone-200 text-stone-800',
  outline: 'border border-stone-200 hover:bg-stone-50 text-stone-700',
  ghost: 'hover:bg-stone-100 text-stone-600',
  danger: 'bg-red-500 hover:bg-red-600 text-white',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
  icon: 'p-2 rounded-xl',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" color="current" />}
      {children}
    </button>
  );
}
