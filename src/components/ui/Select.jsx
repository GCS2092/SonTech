import { clsx } from 'clsx';
import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className, ...props },
  ref
) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-stone-700">{label}</label>
      )}
      <select
        ref={ref}
        className={clsx(
          'w-full px-3.5 py-2.5 rounded-xl border text-sm text-stone-800 transition-all outline-none bg-white',
          'focus:ring-2 focus:ring-rose-300 focus:border-rose-400',
          error ? 'border-red-400 bg-red-50' : 'border-stone-200 hover:border-stone-300',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
});

export default Select;
