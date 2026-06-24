export default function DateRangeFilter({ from, to, onFromChange, onToChange, className = '' }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <label className="text-xs text-stone-500 font-medium">Du</label>
      <input
        type="date"
        value={from}
        onChange={(e) => onFromChange(e.target.value)}
        className="border border-stone-200 rounded-lg px-3 py-2 text-sm"
      />
      <label className="text-xs text-stone-500 font-medium">Au</label>
      <input
        type="date"
        value={to}
        onChange={(e) => onToChange(e.target.value)}
        className="border border-stone-200 rounded-lg px-3 py-2 text-sm"
      />
      {(from || to) && (
        <button
          type="button"
          onClick={() => {
            onFromChange('');
            onToChange('');
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2"
        >
          Effacer dates
        </button>
      )}
    </div>
  );
}
