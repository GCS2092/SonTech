import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle, XCircle, Clock, Filter,
  Smartphone, Truck, RefreshCw, Search, RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin.api';
import { motion, AnimatePresence } from 'framer-motion';

const formatPrice = (p) => `${Number(p || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric',
  hour: '2-digit', minute: '2-digit'
});

const PAYMENT_METHOD_CONFIG = {
  MOBILE_MONEY: { label: 'Mobile Money', icon: Smartphone, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  CASH_ON_DELIVERY: { label: 'À la livraison', icon: Truck, color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const PAYMENT_STATUS_CONFIG = {
  PENDING:  { label: 'En attente', color: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-400' },
  PAID:     { label: 'Payé',       color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400' },
  REJECTED: { label: 'Rejeté',     color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-400' },
};

// ✅ Modal de confirmation avec champ commentaire pour remise en attente
function ConfirmModal({ isOpen, onClose, onConfirm, action, order, isPending }) {
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const isValidate = action === 'PAID';
  const isReset = action === 'PENDING';
  const isReject = action === 'REJECTED';

  const handleConfirm = () => {
    if (isReset && !note.trim()) {
      toast.error('Le commentaire est obligatoire');
      return;
    }
    onConfirm(note);
  };

  const handleClose = () => {
    setNote('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-40"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                isValidate ? 'bg-emerald-100' : isReset ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {isValidate
                  ? <CheckCircle size={24} className="text-emerald-600" />
                  : isReset
                  ? <RotateCcw size={24} className="text-amber-600" />
                  : <XCircle size={24} className="text-red-600" />}
              </div>
              <div className="text-center">
                <h3 className="font-bold text-stone-900 text-lg">
                  {isValidate ? 'Valider le paiement ?' : isReset ? 'Remettre en attente ?' : 'Rejeter le paiement ?'}
                </h3>
                <p className="text-sm text-stone-500 mt-1">
                  Commande <span className="font-mono font-bold">{order?.orderNumber}</span>
                </p>
                <p className="text-lg font-bold text-stone-900 mt-1">
                  {formatPrice(order?.total)}
                </p>
                {isValidate && (
                  <p className="text-xs text-emerald-600 bg-emerald-50 rounded-xl px-3 py-2 mt-2">
                    Le stock sera automatiquement décrémenté
                  </p>
                )}
                {isReset && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2 mt-2">
                    Le stock sera réincrémenté automatiquement
                  </p>
                )}
              </div>

              {/* ✅ Champ commentaire obligatoire pour remise en attente */}
              {(isReset || isReject) && (
                <div>
                  <label className="text-xs font-semibold text-stone-600 mb-1 block">
                    Commentaire {isReset ? <span className="text-red-500">*</span> : '(optionnel)'}
                  </label>
                  <textarea
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder={isReset ? 'Raison de la remise en attente...' : 'Raison du rejet...'}
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-rose-300 resize-none"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    isValidate ? 'bg-emerald-500 hover:bg-emerald-600'
                    : isReset ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-red-500 hover:bg-red-600'
                  }`}
                >
                  {isPending ? '...' : isValidate ? 'Valider' : isReset ? 'Remettre en attente' : 'Rejeter'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default function AdminPayments() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ paymentMethod: '', paymentStatus: '', page: 1, phone: '' });
  const [phoneInput, setPhoneInput] = useState('');
  const [modal, setModal] = useState({ open: false, action: null, order: null });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-payments', filters],
    queryFn: () => adminApi.getOrders({
      ...filters,
      paymentMethod: filters.paymentMethod || undefined,
      paymentStatus: filters.paymentStatus || undefined,
      phone: filters.phone || undefined,
    }).then(r => r.data),
  });

  const { mutate: updatePayment, isPending } = useMutation({
    mutationFn: ({ id, status, note }) => adminApi.updatePayment(id, { paymentStatus: status, note }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-payments'] });
      setModal({ open: false, action: null, order: null });
      toast.success(
        vars.status === 'PAID' ? 'Paiement validé ✅'
        : vars.status === 'PENDING' ? 'Paiement remis en attente 🔄'
        : 'Paiement rejeté ❌'
      );
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const openModal = (action, order) => setModal({ open: true, action, order });
  const closeModal = () => setModal({ open: false, action: null, order: null });

  const handleConfirm = (note) => {
    updatePayment({ id: modal.order.id, status: modal.action, note });
  };

  const handlePhoneSearch = (e) => {
    e.preventDefault();
    setFilters(f => ({ ...f, phone: phoneInput, page: 1 }));
  };

  const handleReset = () => {
    setFilters({ paymentMethod: '', paymentStatus: '', page: 1, phone: '' });
    setPhoneInput('');
  };

  const orders = data?.data || [];
  const total = data?.total || 0;
  const pendingCount = orders.filter(o => o.paymentStatus === 'PENDING').length;
  const hasFilters = filters.paymentMethod || filters.paymentStatus || filters.phone;

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">

      <ConfirmModal
        isOpen={modal.open}
        onClose={closeModal}
        onConfirm={handleConfirm}
        action={modal.action}
        order={modal.order}
        isPending={isPending}
      />

      {/* Header */}
      <div className="mb-6 pl-12 lg:pl-0">
        <div className="flex items-center gap-2 mb-1">
          <Smartphone size={16} className="text-rose-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Paiements</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Gestion des paiements</h1>
            <p className="text-stone-500 text-sm mt-1">{total} paiement{total > 1 ? 's' : ''} au total</p>
          </div>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium text-stone-600 hover:bg-white transition-colors"
          >
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      {/* Alerte paiements en attente */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <div className="font-semibold text-amber-800 text-sm">
              {pendingCount} paiement{pendingCount > 1 ? 's' : ''} en attente de validation
            </div>
            <div className="text-xs text-amber-600">Vérifiez votre téléphone et validez</div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-4 flex flex-wrap gap-3 items-center">
        <Filter size={15} className="text-stone-400" />

        {/* ✅ Recherche par téléphone */}
        <form onSubmit={handlePhoneSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={phoneInput}
              onChange={e => setPhoneInput(e.target.value)}
              placeholder="Rechercher par téléphone..."
              className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-rose-300 w-52"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
          >
            Chercher
          </button>
        </form>

        <select
          value={filters.paymentMethod}
          onChange={e => setFilters(f => ({ ...f, paymentMethod: e.target.value, page: 1 }))}
          className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-rose-300 bg-white"
        >
          <option value="">Tous les modes</option>
          <option value="MOBILE_MONEY">Mobile Money</option>
          <option value="CASH_ON_DELIVERY">À la livraison</option>
        </select>

        <select
          value={filters.paymentStatus}
          onChange={e => setFilters(f => ({ ...f, paymentStatus: e.target.value, page: 1 }))}
          className="px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700 outline-none focus:ring-2 focus:ring-rose-300 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Payé</option>
          <option value="REJECTED">Rejeté</option>
        </select>

        {hasFilters && (
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-xl text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <Smartphone size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Aucun paiement trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const methodCfg = PAYMENT_METHOD_CONFIG[order.paymentMethod] || PAYMENT_METHOD_CONFIG.MOBILE_MONEY;
            const statusCfg = PAYMENT_STATUS_CONFIG[order.paymentStatus] || PAYMENT_STATUS_CONFIG.PENDING;
            const MethodIcon = methodCfg.icon;
            const isPending = order.paymentStatus === 'PENDING';
            const isPaid = order.paymentStatus === 'PAID';

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">

                  {/* Infos commande */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${methodCfg.color}`}>
                      <MethodIcon size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-stone-900 text-sm">
                          {order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${methodCfg.color}`}>
                          {methodCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        {order.user?.firstName} {order.user?.lastName}
                        {order.user?.phone && ` · ${order.user.phone}`}
                      </p>
                      <p className="text-xs text-stone-400">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  {/* Montant */}
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-stone-900">{formatPrice(order.total)}</div>
                    <div className="text-xs text-stone-400">{order.items?.length} article{order.items?.length > 1 ? 's' : ''}</div>
                  </div>

                  {/* Actions pour PENDING */}
                  {isPending && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => openModal('REJECTED', order)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-semibold transition-colors"
                      >
                        <XCircle size={14} /> Rejeter
                      </button>
                      <button
                        onClick={() => openModal('PAID', order)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold transition-colors"
                      >
                        <CheckCircle size={14} /> Valider
                      </button>
                    </div>
                  )}

                  {/* ✅ Action pour PAID → remettre en attente */}
                  {isPaid && (
                    <div className="flex gap-2 shrink-0">
                      <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${statusCfg.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                        {statusCfg.label}
                      </div>
                      <button
                        onClick={() => openModal('PENDING', order)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100 text-xs font-semibold transition-colors"
                      >
                        <RotateCcw size={14} /> Remettre en attente
                      </button>
                    </div>
                  )}

                  {/* Statut pour REJECTED */}
                  {!isPending && !isPaid && (
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold shrink-0 ${statusCfg.color}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </div>
                  )}
                </div>

                {/* Items aperçu */}
                {order.items?.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-50 flex gap-2 flex-wrap">
                    {order.items.slice(0, 3).map((item, i) => (
                      <span key={i} className="text-xs text-stone-500 bg-stone-50 rounded-lg px-2 py-1">
                        {item.productName} x{item.quantity}
                      </span>
                    ))}
                    {order.items.length > 3 && (
                      <span className="text-xs text-stone-400 bg-stone-50 rounded-lg px-2 py-1">
                        +{order.items.length - 3} autres
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
            disabled={filters.page === 1}
            className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
          >
            Précédent
          </button>
          <span className="text-sm text-stone-500">
            Page {filters.page} / {data.totalPages}
          </span>
          <button
            onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
            disabled={filters.page === data.totalPages}
            className="px-4 py-2 rounded-xl border border-stone-200 text-sm font-medium disabled:opacity-40 hover:bg-white transition-colors"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}