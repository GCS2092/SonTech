import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRightLeft, Plus, CheckCircle, XCircle, Clock,
  ChevronDown, ChevronUp, Package, Store, Search,
  AlertTriangle, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '../../api/axios';
import { adminApi } from '../../api/admin.api';
import useAuthStore from '../../store/authStore';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  PENDING:   { label: 'En attente',  color: 'bg-amber-100 text-amber-700',     icon: Clock },
  VALIDATED: { label: 'Validé',      color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  CANCELLED: { label: 'Annulé',      color: 'bg-red-100 text-red-700',         icon: XCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ── Modal création de transfert ───────────────────────────────────────────────

function CreateTransferModal({ stores, onClose, onCreated }) {
  const [fromStoreId, setFromStoreId] = useState('');
  const [toStoreId, setToStoreId]     = useState('');
  const [notes, setNotes]             = useState('');
  const [items, setItems]             = useState([{ productId: '', variantId: '', quantity: 1, _variants: [], _stock: null }]);
  const [productSearch, setProductSearch] = useState('');

  const { data: productsRaw = [] } = useQuery({
    queryKey: ['transfer-products', productSearch],
    queryFn: () =>
      api.get('/api/products', { params: { search: productSearch, limit: 30, isActive: true } })
        .then((r) => {
          const d = r.data;
          return Array.isArray(d) ? d : d?.data || [];
        }),
  });

  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (data) => adminApi.createStockTransfer(data),
    onSuccess: () => {
      toast.success('Transfert créé — en attente de validation');
      qc.invalidateQueries({ queryKey: ['stock-transfers'] });
      onCreated();
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur lors de la création'),
  });

  const addItem = () =>
    setItems((prev) => [...prev, { productId: '', variantId: '', quantity: 1, _variants: [], _stock: null }]);

  const removeItem = (i) =>
    setItems((prev) => prev.filter((_, idx) => idx !== i));

  const updateItem = (i, field, value) =>
    setItems((prev) =>
      prev.map((item, idx) => (idx === i ? { ...item, [field]: value } : item))
    );

  const handleProductChange = (i, productId) => {
    const product = productsRaw.find((p) => p.id === productId);
    const variants = product?.variants || [];
    const available = product ? Math.max(0, (product.stock || 0) - (product.reservedStock || 0)) : null;
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === i
          ? { ...item, productId, variantId: '', _variants: variants, _stock: available }
          : item
      )
    );
  };

  const handleVariantChange = (i, variantId) => {
    const item = items[i];
    const variant = item._variants.find((v) => v.id === variantId);
    const available = variant
      ? Math.max(0, (variant.stock || 0) - (variant.reservedStock || 0))
      : items[i]._stock;
    setItems((prev) =>
      prev.map((it, idx) => (idx === i ? { ...it, variantId, _stock: available } : it))
    );
  };

  const handleSubmit = () => {
    if (!fromStoreId || !toStoreId) return toast.error('Sélectionnez les deux boutiques');
    if (fromStoreId === toStoreId)   return toast.error('Les boutiques doivent être différentes');

    const validItems = items.filter((it) => it.productId && it.quantity > 0);
    if (!validItems.length) return toast.error('Ajoutez au moins un produit');

    for (const it of validItems) {
      if (it._stock !== null && it.quantity > it._stock) {
        return toast.error(`Quantité demandée (${it.quantity}) > stock disponible (${it._stock})`);
      }
    }

    mutation.mutate({
      fromStoreId,
      toStoreId,
      notes,
      items: validItems.map(({ productId, variantId, quantity }) => ({
        productId,
        variantId: variantId || undefined,
        quantity,
      })),
    });
  };

  const fromStore = stores.find((s) => s.id === fromStoreId);
  const toStore   = stores.find((s) => s.id === toStoreId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800 flex items-center gap-2">
            <ArrowRightLeft size={20} className="text-rose-500" />
            Nouveau transfert de stock
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg text-stone-400">
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">

          {/* Boutiques */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Boutique source</label>
              <select
                value={fromStoreId}
                onChange={(e) => setFromStoreId(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">Sélectionner…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === toStoreId}>
                    {s.name} ({s.code}){s.isMain ? ' — Siège' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1">Boutique destination</label>
              <select
                value={toStoreId}
                onChange={(e) => setToStoreId(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300"
              >
                <option value="">Sélectionner…</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id} disabled={s.id === fromStoreId}>
                    {s.name} ({s.code}){s.isMain ? ' — Siège' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Résumé boutiques sélectionnées */}
          {fromStore && toStore && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-sm">
              <Store size={14} className="text-rose-500 shrink-0" />
              <span className="font-medium text-stone-700">{fromStore.name}</span>
              <ArrowRightLeft size={14} className="text-rose-400 shrink-0" />
              <span className="font-medium text-stone-700">{toStore.name}</span>
            </div>
          )}

          {/* Recherche produits */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Rechercher un produit</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Nom du produit…"
                className="w-full pl-9 pr-4 py-2.5 border border-stone-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300"
              />
            </div>
          </div>

          {/* Lignes de produits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-stone-700">Produits à transférer</span>
              <button
                onClick={addItem}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
              >
                <Plus size={14} /> Ajouter une ligne
              </button>
            </div>

            {items.map((item, i) => (
              <div key={i} className="bg-stone-50 p-4 rounded-xl space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleProductChange(i, e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                    >
                      <option value="">Choisir un produit…</option>
                      {productsRaw.map((p) => {
                        const avail = Math.max(0, (p.stock || 0) - (p.reservedStock || 0));
                        return (
                          <option key={p.id} value={p.id} disabled={avail === 0}>
                            {p.name} — dispo : {avail}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="w-24">
                    <input
                      type="number"
                      min="1"
                      max={item._stock ?? undefined}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, 'quantity', Number(e.target.value))}
                      placeholder="Qté"
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 bg-white text-center"
                    />
                  </div>

                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(i)}
                      className="p-2 text-stone-400 hover:text-red-500 transition-colors mt-0.5"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>

                {item.productId && item._variants.length > 0 && (
                  <div>
                    <label className="text-xs text-stone-500 mb-1 block">Variante</label>
                    <select
                      value={item.variantId}
                      onChange={(e) => handleVariantChange(i, e.target.value)}
                      className="w-full border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 bg-white"
                    >
                      <option value="">Sans variante (produit global)</option>
                      {item._variants.map((v) => {
                        const avail = Math.max(0, (v.stock || 0) - (v.reservedStock || 0));
                        return (
                          <option key={v.id} value={v.id} disabled={avail === 0}>
                            {v.size} / {v.color} — dispo : {avail}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {item.productId && item._stock !== null && (
                  <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
                    item._stock === 0
                      ? 'bg-red-50 text-red-600'
                      : item.quantity > item._stock
                      ? 'bg-orange-50 text-orange-600'
                      : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {item._stock === 0
                      ? <><AlertTriangle size={12} /> Rupture de stock — transfert impossible</>
                      : item.quantity > item._stock
                      ? <><AlertTriangle size={12} /> Quantité demandée dépasse le stock disponible ({item._stock})</>
                      : <><Info size={12} /> Stock disponible : {item._stock} unité{item._stock > 1 ? 's' : ''}</>
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Raison du transfert, référence interne…"
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none"
            />
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 flex gap-2">
            <Info size={14} className="shrink-0 mt-0.5" />
            <span>
              Lors de la <strong>validation</strong>, des mouvements de stock (<code>TRANSFER_OUT</code> / <code>TRANSFER_IN</code>)
              seront créés automatiquement dans la comptabilité de chaque boutique.
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="px-5 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ArrowRightLeft size={15} />
            {mutation.isPending ? 'Création…' : 'Créer le transfert'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Ligne de transfert (accordéon) ────────────────────────────────────────────

function TransferRow({ transfer, isAdmin }) {
  const [open, setOpen] = useState(false);
  const qc = useQueryClient();

  const validateMutation = useMutation({
    mutationFn: () => adminApi.validateStockTransfer(transfer.id),
    onSuccess: () => {
      toast.success('Transfert validé — stock mis à jour dans les deux boutiques');
      qc.invalidateQueries({ queryKey: ['stock-transfers'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Erreur de validation'),
  });

  const cancelMutation = useMutation({
    mutationFn: () => adminApi.cancelStockTransfer(transfer.id, 'Annulation manuelle'),
    onSuccess: () => {
      toast.success('Transfert annulé');
      qc.invalidateQueries({ queryKey: ['stock-transfers'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || "Erreur d'annulation"),
  });

  return (
    <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden shadow-sm">

      {/* En-tête */}
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-stone-50 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-bold text-stone-700">{transfer.transferNumber}</span>
            <StatusBadge status={transfer.status} />
          </div>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-stone-500 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-stone-600">
              <Store size={11} />{transfer.fromStore?.name}
            </span>
            <ArrowRightLeft size={11} className="text-rose-400" />
            <span className="flex items-center gap-1 font-medium text-stone-600">
              <Store size={11} />{transfer.toStore?.name}
            </span>
            <span className="text-stone-400">·</span>
            <span>{transfer.items?.length} article{transfer.items?.length > 1 ? 's' : ''}</span>
            <span className="text-stone-400">·</span>
            <span>{new Date(transfer.createdAt).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* ← Valider/Annuler uniquement pour ADMIN */}
          {isAdmin && transfer.status === 'PENDING' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Valider ce transfert ? Le stock sera mis à jour immédiatement dans les deux boutiques.')) {
                    validateMutation.mutate();
                  }
                }}
                disabled={validateMutation.isPending}
                className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50"
              >
                {validateMutation.isPending ? '…' : '✓ Valider'}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('Annuler ce transfert ?')) cancelMutation.mutate();
                }}
                disabled={cancelMutation.isPending}
                className="px-3 py-1.5 bg-stone-100 text-stone-600 rounded-lg text-xs font-medium hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
            </>
          )}
          {/* STAFF : message informatif si en attente */}
          {!isAdmin && transfer.status === 'PENDING' && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
              En attente de validation admin
            </span>
          )}
          {open
            ? <ChevronUp size={16} className="text-stone-400" />
            : <ChevronDown size={16} className="text-stone-400" />
          }
        </div>
      </div>

      {/* Détail */}
      {open && (
        <div className="border-t border-stone-100 bg-stone-50 p-4 space-y-3">
          {transfer.notes && (
            <p className="text-sm text-stone-500 italic bg-white rounded-lg px-3 py-2">
              📝 {transfer.notes}
            </p>
          )}

          <div className="space-y-2">
            {transfer.items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded-xl px-4 py-3 text-sm">
                <div className="flex items-center gap-2">
                  <Package size={14} className="text-stone-400" />
                  <span className="font-medium text-stone-700">{item.product?.name}</span>
                  {item.variant && (
                    <span className="text-xs text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {item.variant.size} / {item.variant.color}
                    </span>
                  )}
                </div>
                <span className="font-bold text-stone-800">× {item.quantity}</span>
              </div>
            ))}
          </div>

          {transfer.status === 'VALIDATED' && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex gap-2">
              <CheckCircle size={13} className="shrink-0 mt-0.5" />
              <span>
                Mouvements <strong>TRANSFER_OUT</strong> ({transfer.fromStore?.name}) et{' '}
                <strong>TRANSFER_IN</strong> ({transfer.toStore?.name}) enregistrés en comptabilité.
                {transfer.validatedAt && ` Validé le ${new Date(transfer.validatedAt).toLocaleString('fr-FR')}.`}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────

export default function AdminStockTransfers() {
  const [showModal, setShowModal]       = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [storeFilter, setStoreFilter]   = useState('');

  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['stock-transfers', { status: statusFilter, storeId: storeFilter }],
    queryFn: () =>
      adminApi.getStockTransfers({
        status:  statusFilter || undefined,
        storeId: storeFilter  || undefined,
      }).then((r) => r.data),
  });

  const { data: stores = [] } = useQuery({
    queryKey: ['stores-list'],
    queryFn:  () => adminApi.getStores().then((r) => r.data),
  });

  const pending   = transfers.filter((t) => t.status === 'PENDING').length;
  const validated = transfers.filter((t) => t.status === 'VALIDATED').length;
  const cancelled = transfers.filter((t) => t.status === 'CANCELLED').length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 pl-12 lg:pl-0">
        <div>
          <h1 className="text-2xl font-bold text-stone-800 flex items-center gap-2">
            <ArrowRightLeft className="text-rose-500" size={22} />
            Transferts de stock
          </h1>
          <p className="text-stone-400 text-sm mt-0.5">
            Mouvements de produits entre boutiques · traçabilité comptable automatique
          </p>
        </div>
        {/* Créer un transfert — STAFF et ADMIN peuvent créer */}
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 text-white rounded-xl text-sm font-medium hover:bg-rose-600 transition-colors shadow-sm"
        >
          <Plus size={16} />
          Nouveau transfert
        </button>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total',      value: transfers.length, color: 'text-stone-700',   bg: 'bg-stone-50' },
          { label: 'En attente', value: pending,          color: 'text-amber-600',   bg: 'bg-amber-50' },
          { label: 'Validés',    value: validated,        color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Annulés',    value: cancelled,        color: 'text-red-500',     bg: 'bg-red-50' },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-2xl border border-stone-100 p-4 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-stone-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="VALIDATED">Validés</option>
          <option value="CANCELLED">Annulés</option>
        </select>

        <select
          value={storeFilter}
          onChange={(e) => setStoreFilter(e.target.value)}
          className="border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-rose-300 bg-white"
        >
          <option value="">Toutes les boutiques</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code}){s.isMain ? ' — Siège' : ''}
            </option>
          ))}
        </select>

        {(statusFilter || storeFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setStoreFilter(''); }}
            className="text-xs text-stone-400 hover:text-rose-500 underline"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-stone-100 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : transfers.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <ArrowRightLeft size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Aucun transfert trouvé</p>
          <p className="text-sm mt-1">
            {statusFilter || storeFilter
              ? 'Essayez de modifier les filtres'
              : 'Créez votre premier transfert de stock entre boutiques'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {transfers.map((t) => (
            <TransferRow key={t.id} transfer={t} isAdmin={isAdmin} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <CreateTransferModal
          stores={stores}
          onClose={() => setShowModal(false)}
          onCreated={() => setShowModal(false)}
        />
      )}
    </div>
  );
}