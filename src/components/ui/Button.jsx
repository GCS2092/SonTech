import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Spinner from './Spinner';

const cn = (...args) => twMerge(clsx(...args));

const variants = {
  primary:   'bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white',
  dark:      'bg-slate-900 hover:bg-slate-800 active:bg-slate-700 text-slate-100',
  outline:   'border-2 border-blue-700 text-blue-700 hover:bg-blue-50 active:bg-blue-100',
  secondary: 'bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-800 border border-stone-200',
  ghost:     'hover:bg-stone-100 active:bg-stone-200 text-stone-500',
  danger:    'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
};

const sizes = {
  sm:   'px-3 py-1.5 text-xs   rounded-lg  gap-1.5 h-8',
  md:   'px-4 py-2   text-sm   rounded-lg  gap-2   h-9',
  lg:   'px-6 py-2.5 text-sm   rounded-xl  gap-2   h-11',
  xl:   'px-8 py-3   text-[15px] rounded-xl gap-2.5 h-12',
  icon: 'p-2 rounded-lg aspect-square',
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
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
        'disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]',
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