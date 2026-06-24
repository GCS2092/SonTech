import { useState, useEffect } from 'react';
import { couponsApi } from '../../api/coupons.api';

const formatDate = (iso) => iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';
const formatDiscount = (type, value) =>
  type === 'PERCENTAGE' ? `${value}%` : `${Number(value).toLocaleString('fr-FR')} FCFA`;

// Génère un code aléatoire style "URBAN-A3X9K"
const generateCode = () => {
  const prefix = ['URBAN', 'PROMO', 'BEAUTY', 'VIP', 'SPECIAL'][Math.floor(Math.random() * 5)];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const suffix = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${suffix}`;
};

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const emptyForm = {
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minOrderAmount: '',
    maxUses: '',
    expiresAt: '',
    isActive: true,
  };
  const [form, setForm] = useState(emptyForm);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchCoupons = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await couponsApi.getAll();
      const data = res.data;
      setCoupons(Array.isArray(data) ? data : data.data || []);
    } catch (e) {
      setError(e.message || 'Erreur chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setForm(emptyForm); setSelected(null); setModal('create'); };
  const openEdit = (c) => {
    setForm({
      code: c.code,
      type: c.type,
      value: c.value,
      minOrderAmount: c.minOrderAmount || '',
      maxUses: c.maxUses || '',
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : '',
      isActive: c.isActive ?? true,
    });
    setSelected(c);
    setModal('edit');
  };
  const openDelete = (c) => { setSelected(c); setModal('delete'); };
  const closeModal = () => { setModal(null); setSelected(null); };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const buildBody = () => ({
    code: form.code.toUpperCase(),
    type: form.type,
    value: Number(form.value),
    minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
    maxUses: form.maxUses ? Number(form.maxUses) : undefined,
    expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    isActive: form.isActive,
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await couponsApi.create(buildBody());
      await fetchCoupons();
      closeModal();
      showToast('Coupon créé ✓');
    } catch (e) {
      showToast(e.message || 'Erreur création', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await couponsApi.update(selected.id, buildBody());
      await fetchCoupons();
      closeModal();
      showToast('Coupon modifié ✓');
    } catch (e) {
      showToast(e.message || 'Erreur modification', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setSubmitting(true);
    try {
      await couponsApi.delete(selected.id);
      await fetchCoupons();
      closeModal();
      showToast('Coupon supprimé ✓');
    } catch (e) {
      showToast(e.message || 'Erreur suppression', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle rapide actif/inactif depuis le tableau
  const handleToggleActive = async (c) => {
    try {
      await couponsApi.update(c.id, { isActive: !c.isActive });
      await fetchCoupons();
      showToast(c.isActive ? 'Coupon désactivé' : 'Coupon activé ✓');
    } catch (e) {
      showToast('Erreur mise à jour', 'error');
    }
  };

  const inputClass = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/20 focus:border-gray-400 transition';

  // Coupons visibles sur le site = actifs + non expirés + non épuisés
  const visibleOnSite = coupons.filter(c =>
    c.isActive &&
    (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
    (c.maxUses === null || c.maxUses === undefined || c.usedCount < c.maxUses)
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
          {toast.message}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors">
          <span className="text-lg leading-none">+</span> Nouveau coupon
        </button>
      </div>

      {/* Indicateur coupons visibles sur le site */}
      {visibleOnSite.length > 0 && (
        <div className="mb-6 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-rose-500 text-lg">🔴</span>
          <p className="text-sm text-rose-700 font-medium">
            {visibleOnSite.length} coupon{visibleOnSite.length > 1 ? 's' : ''} actuellement affiché{visibleOnSite.length > 1 ? 's' : ''} dans la bannière du site :
            {' '}{visibleOnSite.map(c => <span key={c.id} className="font-mono bg-rose-100 px-1.5 py-0.5 rounded mx-0.5">{c.code}</span>)}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error} — <button onClick={fetchCoupons} className="underline font-medium">Réessayer</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <svg className="animate-spin h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Chargement...
          </div>
        ) : coupons.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <div className="text-4xl mb-3">🎟️</div>
            <p className="font-medium">Aucun coupon</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-6 py-3">Code</th>
                  <th className="px-6 py-3">Réduction</th>
                  <th className="px-6 py-3">Min. commande</th>
                  <th className="px-6 py-3">Utilisations</th>
                  <th className="px-6 py-3">Expiration</th>
                  <th className="px-6 py-3">Statut / Site</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {coupons.map((c) => {
                  const shownOnSite = c.isActive &&
                    (!c.expiresAt || new Date(c.expiresAt) > new Date()) &&
                    (c.maxUses == null || c.usedCount < c.maxUses);
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-gray-900 bg-gray-100 px-2 py-1 rounded">{c.code}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{formatDiscount(c.type, c.value)}</td>
                      <td className="px-6 py-4 text-gray-600">{c.minOrderAmount ? `${Number(c.minOrderAmount).toLocaleString('fr-FR')} FCFA` : '—'}</td>
                      <td className="px-6 py-4 text-gray-600">{c.usedCount ?? 0}{c.maxUses ? ` / ${c.maxUses}` : ''}</td>
                      <td className="px-6 py-4 text-gray-600">{formatDate(c.expiresAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {/* Toggle actif/inactif rapide */}
                          <button
                            onClick={() => handleToggleActive(c)}
                            className={`px-2 py-1 rounded-full text-xs font-medium w-fit transition-colors ${c.isActive ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                          >
                            {c.isActive ? 'Actif' : 'Inactif'}
                          </button>
                          {/* Indicateur visible sur le site */}
                          {shownOnSite && (
                            <span className="text-[10px] text-rose-500 font-medium flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-pulse" />
                              Affiché sur le site
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openEdit(c)} className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors font-medium">Modifier</button>
                          <button onClick={() => openDelete(c)} className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition-colors font-medium">Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(modal === 'create' || modal === 'edit') && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'Nouveau coupon' : 'Modifier le coupon'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>
            <form onSubmit={modal === 'create' ? handleCreate : handleEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code <span className="text-red-500">*</span></label>
                <div className="flex gap-2">
                  <input
                    name="code"
                    value={form.code}
                    onChange={handleChange}
                    required
                    placeholder="EX: PROMO20"
                    className={inputClass}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {/* NOUVEAU : bouton génération automatique */}
                  <button
                    type="button"
                    onClick={() => setForm(p => ({ ...p, code: generateCode() }))}
                    className="shrink-0 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
                    title="Générer un code aléatoire"
                  >
                    🎲 Auto
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Saisis un code manuellement ou clique sur Auto pour en générer un.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type <span className="text-red-500">*</span></label>
                  <select name="type" value={form.type} onChange={handleChange} className={inputClass}>
                    <option value="PERCENTAGE">Pourcentage (%)</option>
                    <option value="FIXED">Montant fixe (FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valeur <span className="text-red-500">*</span></label>
                  <input type="number" name="value" value={form.value} onChange={handleChange} required min="0" placeholder={form.type === 'PERCENTAGE' ? '20' : '5000'} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. commande (FCFA)</label>
                  <input type="number" name="minOrderAmount" value={form.minOrderAmount} onChange={handleChange} min="0" placeholder="10000" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max. utilisations</label>
                  <input type="number" name="maxUses" value={form.maxUses} onChange={handleChange} min="1" placeholder="100" className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date d'expiration</label>
                <input type="date" name="expiresAt" value={form.expiresAt} onChange={handleChange} className={inputClass} />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <label className="text-sm font-medium text-gray-700">Coupon actif</label>
                  <p className="text-xs text-gray-400">S'affiche dans la bannière du site si actif</p>
                </div>
                <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.isActive ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-black text-white rounded-lg py-2 text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-60">
                  {submitting ? 'En cours...' : modal === 'create' ? 'Créer' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modal === 'delete' && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">🗑️</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Supprimer le coupon ?</h2>
            <p className="text-sm text-gray-500 mb-6">Le coupon <span className="font-mono font-semibold text-gray-800">{selected.code}</span> sera supprimé définitivement.</p>
            <div className="flex gap-3">
              <button onClick={closeModal} className="flex-1 border border-gray-200 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors">Annuler</button>
              <button onClick={handleDelete} disabled={submitting} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-60">
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}