import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  X, Search, Plus, Minus, Trash2,
  ChevronRight, ChevronLeft, User, Package, MapPin, ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin.api';

const ORDER_STATUSES = [
  { value: 'DRAFT',      label: 'Brouillon WhatsApp' },
  { value: 'PENDING',    label: 'En attente' },
  { value: 'CONFIRMED',  label: 'Confirmée' },
  { value: 'PROCESSING', label: 'En traitement' },
  { value: 'SHIPPED',    label: 'Expédiée' },
  { value: 'DELIVERED',  label: 'Livrée' },
  { value: 'CANCELLED',  label: 'Annulée' },
];

const PAYMENT_METHODS = [
  { value: 'CASH_ON_DELIVERY', label: 'Paiement à la livraison' },
  { value: 'MOBILE_MONEY',     label: 'Mobile Money' },
];

const STEPS = [
  { id: 1, label: 'Client',    icon: User },
  { id: 2, label: 'Produits',  icon: Package },
  { id: 3, label: 'Livraison', icon: MapPin },
  { id: 4, label: 'Récap',     icon: ClipboardList },
];

const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} FCFA`;

const emptyAddress = {
  fullName: '',
  phone:    '',
  street:   '',
  city:     '',
  country:  'Sénégal',
};

export default function CreateOrderModal({ onClose, onCreated, storeId }) {
  const [step, setStep]                 = useState(1);
  const [clientType, setClientType]     = useState('existing');
  const [selectedUser, setSelectedUser] = useState(null);
  const [guest, setGuest]               = useState({ name: '', email: '', phone: '' });
  const [userSearch, setUserSearch]     = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [cartItems, setCartItems]       = useState([]);
  const [address, setAddress]           = useState(emptyAddress);
  const [status, setStatus]             = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY');
  const [notes, setNotes]               = useState('');
  const [submitting, setSubmitting]     = useState(false);

  const [debouncedUserQ, setDebouncedUserQ]       = useState('');
  const [debouncedProductQ, setDebouncedProductQ] = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedUserQ(userSearch), 350);
  }, [userSearch]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedProductQ(productSearch), 350);
  }, [productSearch]);

  // ── Données ──────────────────────────────────────────────────────
  const { data: users = [], isFetching: loadingUsers } = useQuery({
    queryKey: ['admin-user-search', debouncedUserQ],
    queryFn: () => adminApi.searchUsers(debouncedUserQ).then((r) => r.data),
    enabled: clientType === 'existing' && step === 1,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-select'],
    queryFn: () => adminApi.getCategories().then((r) => r.data?.data ?? r.data ?? []),
  });

  const { data: products = [], isFetching: loadingProducts } = useQuery({
    queryKey: ['admin-product-search', debouncedProductQ, selectedCategoryId],
    queryFn: () =>
      adminApi.searchProducts({
        q: debouncedProductQ,
        ...(selectedCategoryId && { categoryId: selectedCategoryId }),
        ...(storeId && { storeId }),
      }).then((r) => r.data),
    enabled: step === 2,
  });

  // ── Panier ───────────────────────────────────────────────────────
  const addToCart = (product, variant = null) => {
    const key = variant ? `${product.id}__${variant.id}` : product.id;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i);
      }
      const price = variant?.price ?? product.price;
      return [...prev, {
        key,
        productId:    product.id,
        variantId:    variant?.id ?? null,
        productName:  product.name,
        variantLabel: variant?.label ?? null,
        price,
        quantity: 1,
        image: product.images?.[0]?.url ?? null,
      }];
    });
  };

  const updateQty  = (key, delta) =>
    setCartItems((prev) =>
      prev.map((i) => i.key === key ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i)
    );
  const removeItem = (key) => setCartItems((prev) => prev.filter((i) => i.key !== key));

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);

  // ── Adresse : au moins une valeur renseignée = on la passe ───────
  const hasAddress = Object.values(address).some((v) => v.trim().length > 0 && v !== 'Sénégal');
  const shippingAddress = hasAddress ? address : null;

  // ── Validation étape ─────────────────────────────────────────────
  const canGoNext = () => {
    if (step === 1) {
      return clientType === 'existing' ? !!selectedUser : guest.name.trim().length > 0;
    }
    if (step === 2) return cartItems.length > 0;
    return true; // étapes 3 et 4 toujours valides
  };

  // ── Soumission ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        status,
        paymentMethod,
        notes:           notes || undefined,
        storeId:         storeId || undefined,
        shippingAddress: shippingAddress ?? {},
        items: cartItems.map((i) => ({
          productId:    i.productId,
          variantId:    i.variantId ?? undefined,
          productName:  i.productName,
          variantLabel: i.variantLabel ?? undefined,
          price:        i.price,
          quantity:     i.quantity,
        })),
        ...(clientType === 'existing' && selectedUser
          ? { userId: selectedUser.id }
          : {
              guestName:  guest.name,
              guestEmail: guest.email  || undefined,
              guestPhone: guest.phone  || undefined,
            }),
      };

      await adminApi.createManualOrder(payload);
      toast.success('Commande créée avec succès');
      onCreated?.();
      onClose();
    } catch (e) {
      toast.error(e.message || 'Erreur lors de la création');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Helpers UI ───────────────────────────────────────────────────
  const inputCls = 'w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300';

  const Field = ({ label, required, children }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Nouvelle commande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-0 px-6 py-3 border-b border-gray-100">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isDone   = step > s.id;
            return (
              <div key={s.id} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isActive ? 'bg-rose-600 text-white' :
                  isDone   ? 'bg-emerald-100 text-emerald-700' :
                             'bg-gray-100 text-gray-400'
                }`}>
                  <Icon size={12} />
                  {s.label}
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight size={13} className="mx-1 text-gray-300" />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── ÉTAPE 1 : CLIENT ──────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex rounded-xl overflow-hidden border border-gray-200">
                {['existing', 'guest'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setClientType(t)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      clientType === t ? 'bg-rose-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t === 'existing' ? 'Client existant' : 'Client invité'}
                  </button>
                ))}
              </div>

              {clientType === 'existing' ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      autoFocus
                      type="search"
                      placeholder="Rechercher par nom, email, téléphone…"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300"
                    />
                  </div>

                  {selectedUser ? (
                    <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold text-rose-800">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                        <p className="text-xs text-rose-600">
                          {selectedUser.email}{selectedUser.phone ? ` · ${selectedUser.phone}` : ''}
                        </p>
                      </div>
                      <button onClick={() => setSelectedUser(null)} className="text-rose-400 hover:text-rose-600">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                      {loadingUsers ? (
                        <p className="text-center text-sm text-gray-400 py-6">Recherche…</p>
                      ) : users.length === 0 ? (
                        <p className="text-center text-sm text-gray-400 py-6">
                          {debouncedUserQ ? 'Aucun client trouvé' : 'Tapez pour rechercher'}
                        </p>
                      ) : (
                        <ul className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                          {users.map((u) => (
                            <li key={u.id}>
                              <button
                                onClick={() => setSelectedUser(u)}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                              >
                                <p className="text-sm font-medium text-gray-800">
                                  {u.firstName} {u.lastName}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {u.email}{u.phone ? ` · ${u.phone}` : ''}
                                </p>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Nom complet" required>
                    <input autoFocus type="text" placeholder="Ex : Aminata Diallo"
                      value={guest.name} onChange={(e) => setGuest((g) => ({ ...g, name: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Email">
                    <input type="email" placeholder="client@email.com"
                      value={guest.email} onChange={(e) => setGuest((g) => ({ ...g, email: e.target.value }))}
                      className={inputCls} />
                  </Field>
                  <Field label="Téléphone">
                    <input type="tel" placeholder="+221 77 000 00 00"
                      value={guest.phone} onChange={(e) => setGuest((g) => ({ ...g, phone: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 2 : PRODUITS ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input autoFocus type="search" placeholder="Nom ou référence…"
                    value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-300" />
                </div>
                <select value={selectedCategoryId} onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-rose-300">
                  <option value="">Toutes catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                {loadingProducts ? (
                  <p className="text-center text-sm text-gray-400 py-8">Chargement…</p>
                ) : products.length === 0 ? (
                  <p className="text-center text-sm text-gray-400 py-8">Aucun produit trouvé</p>
                ) : (
                  <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                    {products.map((p) => (
                      <li key={p.id} className="px-4 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {p.images?.[0]?.url ? (
                              <img src={p.images[0].url} alt={p.name}
                                className="w-10 h-10 rounded-lg object-cover shrink-0 border border-gray-100" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                                <Package size={16} className="text-gray-300" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                              <p className="text-xs text-gray-500">{formatPrice(p.price)}</p>
                            </div>
                          </div>
                          {p.variants?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {p.variants.map((v) => (
                                <button key={v.id} onClick={() => addToCart(p, v)}
                                  className="text-xs px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 font-medium">
                                  {v.label ?? `${v.size} / ${v.color}`}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <button onClick={() => addToCart(p)}
                              className="shrink-0 p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors">
                              <Plus size={14} />
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {cartItems.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                    Panier ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})
                  </p>
                  <ul className="space-y-2">
                    {cartItems.map((item) => (
                      <li key={item.key} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {item.productName}
                            {item.variantLabel && <span className="text-gray-500 font-normal"> — {item.variantLabel}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{formatPrice(item.price)} / unité</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => updateQty(item.key, -1)} className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100"><Minus size={12} /></button>
                          <span className="w-7 text-center text-sm font-semibold">{item.quantity}</span>
                          <button onClick={() => updateQty(item.key, 1)}  className="p-1 rounded-lg border border-gray-200 hover:bg-gray-100"><Plus  size={12} /></button>
                          <button onClick={() => removeItem(item.key)} className="p-1 rounded-lg text-red-400 hover:bg-red-50 ml-1"><Trash2 size={12} /></button>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 w-24 text-right shrink-0">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>
                  <div className="flex justify-end mt-2 pt-2 border-t border-gray-200">
                    <p className="text-sm font-bold text-gray-900">Total : {formatPrice(subtotal)}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── ÉTAPE 3 : ADRESSE DE LIVRAISON ───────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-sm text-gray-500 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                Tous les champs sont optionnels — laissez vide si la livraison n'est pas applicable.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Nom complet du destinataire">
                    <input type="text" placeholder="Aminata Diallo"
                      value={address.fullName}
                      onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))}
                      className={inputCls} autoFocus />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Téléphone">
                    <input type="tel" placeholder="+221 77 000 00 00"
                      value={address.phone}
                      onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <Field label="Ville">
                    <input type="text" placeholder="Dakar"
                      value={address.city}
                      onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Adresse / Quartier">
                    <input type="text" placeholder="Rue 10, Cité Keur Gorgui, Appartement 3"
                      value={address.street}
                      onChange={(e) => setAddress((a) => ({ ...a, street: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
                <div className="col-span-2">
                  <Field label="Pays">
                    <input type="text" placeholder="Sénégal"
                      value={address.country}
                      onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))}
                      className={inputCls} />
                  </Field>
                </div>
              </div>
            </div>
          )}

          {/* ── ÉTAPE 4 : RÉCAPITULATIF ───────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">

              {/* Client */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Client</p>
                {clientType === 'existing' && selectedUser ? (
                  <p className="text-sm font-medium text-gray-800">
                    {selectedUser.firstName} {selectedUser.lastName}
                    <span className="text-gray-500 font-normal"> · {selectedUser.email}</span>
                  </p>
                ) : (
                  <p className="text-sm font-medium text-gray-800">
                    {guest.name}
                    {guest.email && <span className="text-gray-500 font-normal"> · {guest.email}</span>}
                    {guest.phone && <span className="text-gray-500 font-normal"> · {guest.phone}</span>}
                  </p>
                )}
              </div>

              {/* Adresse */}
              {shippingAddress ? (
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Livraison</p>
                  <div className="text-sm text-gray-700 space-y-0.5">
                    {shippingAddress.fullName && <p className="font-medium">{shippingAddress.fullName}</p>}
                    {shippingAddress.phone   && <p>{shippingAddress.phone}</p>}
                    {shippingAddress.street  && <p>{shippingAddress.street}</p>}
                    {shippingAddress.city    && <p>{shippingAddress.city}{shippingAddress.country ? `, ${shippingAddress.country}` : ''}</p>}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Livraison</p>
                  <p className="text-sm text-gray-400 italic">Aucune adresse renseignée</p>
                </div>
              )}

              {/* Articles */}
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Articles ({cartItems.length})
                </p>
                <ul className="space-y-1">
                  {cartItems.map((item) => (
                    <li key={item.key} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.productName}
                        {item.variantLabel && <span className="text-gray-500"> ({item.variantLabel})</span>}
                        <span className="text-gray-400"> ×{item.quantity}</span>
                      </span>
                      <span className="font-medium">{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between pt-2 mt-2 border-t border-gray-200 font-bold text-sm">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>

              {/* Statut + Paiement */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Statut initial">
                  <select value={status} onChange={(e) => setStatus(e.target.value)}
                    className={inputCls}>
                    {ORDER_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Mode de paiement">
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}
                    className={inputCls}>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </Field>
              </div>

              {/* Notes */}
              <Field label="Notes internes (optionnel)">
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instructions de livraison, remarques…"
                  rows={3} className={`${inputCls} resize-none`} />
              </Field>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={15} />
            {step === 1 ? 'Annuler' : 'Retour'}
          </button>

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant <ChevronRight size={15} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 transition-colors"
            >
              {submitting ? 'Création…' : 'Créer la commande'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}