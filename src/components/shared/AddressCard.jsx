import { MapPin, Pencil, Trash2 } from 'lucide-react';
import Badge from '../ui/Badge';

export default function AddressCard({ address, onEdit, onDelete }) {
  return (
    <div className="bg-white border border-stone-100 rounded-2xl p-4 flex justify-between items-start gap-3">
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 shrink-0">
          <MapPin size={17} />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-stone-800 text-sm">{address.label}</p>
            {address.isDefault && <Badge variant="rose">Par défaut</Badge>}
          </div>
          <p className="text-sm text-stone-600">{address.fullName}  {address.phone}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {address.street}, {address.city}, {address.country}
          </p>
        </div>
      </div>
      <div className="flex gap-1 shrink-0">
        <button onClick={() => onEdit(address)} className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={() => onDelete(address.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
