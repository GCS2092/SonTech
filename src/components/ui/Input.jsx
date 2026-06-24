import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl border text-stone-800 placeholder-stone-400 transition-all outline-none',
          // ✅ text-sm retiré — font-size géré par index.css (16px) pour éviter zoom iOS
          'bg-white focus:ring-2 focus:ring-rose-300 focus:border-rose-400',
          error
            ? 'border-red-400 bg-red-50'
            : 'border-stone-200 hover:border-stone-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
});

export default Input;