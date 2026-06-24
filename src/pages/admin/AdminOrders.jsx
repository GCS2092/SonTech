import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RefreshCw, Plus, CreditCard, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin.api';
import api from '../../api/axios';
import Pagination from '../../components/shared/Pagination';
import DateRangeFilter from '../../components/admin/DateRangeFilter';
import StoreFilter from '../../components/admin/StoreFilter';
import CreateOrderModal from '../../components/admin/CreateOrderModal';
import { buildOrderConfirmationWhatsAppLink, buildOrderStatusWhatsAppLink } from '../../utils/whatsapp.utils';

const WA_ICON = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const STATUS_LABELS = {
  DRAFT:      { label: 'Brouillon WhatsApp', color: 'bg-orange-100 text-orange-700' },
  PENDING:    { label: 'En attente',          color: 'bg-yellow-100 text-yellow-700' },
  CONFIRMED:  { label: 'Confirmée',           color: 'bg-blue-100 text-blue-700' },
  PROCESSING: { label: 'En traitement',       color: 'bg-purple-100 text-purple-700' },
  SHIPPED:    { label: 'Expédiée',            color: 'bg-indigo-100 text-indigo-700' },
  DELIVERED:  { label: 'Livrée',              color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED:  { label: 'Annulée',             color: 'bg-red-100 text-red-700' },
};

const PAYMENT_LABELS = {
  PENDING:  'Paiement en attente',
  PAID:     'Payé',
  PARTIAL:  'Partiel',
  REJECTED: 'Rejeté',
};

const PAYMENT_COLORS = {
  PENDING:  'text-yellow-600',
  PAID:     'text-emerald-600 font-semibold',
  PARTIAL:  'text-blue-600',
  REJECTED: 'text-red-600',
};

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const formatPrice = (p) => `${Number(p).toLocaleString('fr-FR')} FCFA`;

const getUrgency = (expiresAt) => {
  if (!expiresAt) return null;
  const diffMs = new Date(expiresAt).getTime() - Date.now();
  if (diffMs <= 0) return { label: 'Expirée', color: 'bg-red-100 text-red-700' };
  const hours = diffMs / 3_600_000;
  if (hours < 1)  return { label: `${Math.round(diffMs / 60000)} min`, color: 'bg-red-100 text-red-700' };
  if (hours < 6)  return { label: `${Math.round(hours)} h`, color: 'bg-orange-100 text-orange-700' };
  if (hours < 24) return { label: `${Math.round(hours)} h`, color: 'bg-yellow-100 text-yellow-700' };
  return { label: `${Math.round(hours / 24)} j`, color: 'bg-gray-100 text-gray-600' };
};

const emptyFilters = {
  status: '',
  paymentStatus: '',
  search: '',
  from: '',
  to: '',
  storeId: '',
  destination: '',
};

export default function AdminOrders() {
  const [page, setPage]               = useState(1);
  const [filters, setFilters]         = useState(emptyFilters);
  const [selected, setSelected]       = useState(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus]     = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'todo'

  // Paiement modal
  const [paymentModal, setPaymentModal]   = useState(false);
  const [paymentOrder, setPaymentOrder]   = useState(null);
  const [paymentNote, setPaymentNote]     = useState('');
  const [paymentStatus, setPaymentStatus] = useState('PAID');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const isTodoView = activeTab === 'todo';

  const queryParams = {
    page,
    limit: 20,
    ...(isTodoView
      ? { view: 'todo' }
      : {
          ...(filters.status        && { status: filters.status }),
          ...(filters.paymentStatus && { paymentStatus: filters.paymentStatus }),
        }),
    ...(filters.search.trim() && { search: filters.search.trim() }),
    ...(filters.from          && { from: filters.from }),
    ...(filters.to            && { to: filters.to }),
    ...(filters.storeId       && { storeId: filters.storeId }),
    ...(filters.destination   && { destination: filters.destination }),
  };

  const { data, isLoading, refetch, isFetching, error } = useQuery({
    queryKey: ['admin-orders', activeTab, queryParams],
    queryFn: () => adminApi.getOrders(queryParams).then((r) => r.data),
  });

  // Badge "À traiter" toujours à jour, même sur l'onglet "Toutes"
  const { data: todoData } = useQuery({
    queryKey: ['admin-orders-todo-count', filters.storeId],
    queryFn: () =>
      adminApi
        .getOrders({ view: 'todo', limit: 1, ...(filters.storeId && { storeId: filters.storeId }) })
        .then((r) => r.data),
    refetchInterval: 60_000,
  });
  const todoCount = todoData?.total ?? 0;

  const orders     = data?.data       ?? [];
  const total      = data?.total      ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const updateFilter = (key, value) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setPage(1);
  };

  const openStatusModal = (order) => {
    setSelected(order);
    setNewStatus(order.status);
    setStatusMessage('');
    setStatusModal(true);
  };

  const openPaymentModal = (order) => {
    setPaymentOrder(order);
    setPaymentStatus('PAID');
    setPaymentNote('');
    setPaymentModal(true);
  };

  const handleDownloadInvoice = async (invoice) => {
    setDownloadingPdf(invoice.id);
    try {
      await adminApi.downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
      toast.success('Facture téléchargée');
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleStatusChange = async () => {
    setSubmitting(true);
    try {
      await api.put(`/api/orders/${selected.id}/status`, {
        status: newStatus,
        message: statusMessage || undefined,
      });
      await refetch();
      setStatusModal(false);
      toast.success('Statut mis à jour');
    } catch (e) {
      toast.error(e.message || 'Erreur mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentStatusChange = async () => {
    setSubmittingPayment(true);
    try {
      await api.patch(`/api/admin/orders/${paymentOrder.id}/payment`, {
        paymentStatus,
        note: paymentNote || undefined,
      });
      await refetch();
      setPaymentModal(false);
      toast.success(
        paymentStatus === 'PAID'
          ? '✅ Commande marquée comme payée'
          : 'Statut de paiement mis à jour'
      );
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Erreur');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleConfirmDraft = async (order) => {
    try {
      await adminApi.confirmDraftOrder(order.id);
      await refetch();
      toast.success('Commande WhatsApp confirmée');
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Erreur');
    }
  };

  const handleRejectDraft = async (order) => {
    if (!window.confirm(`Rejeter la commande ${order.orderNumber} ? Le stock sera libéré.`)) return;
    try {
      await adminApi.rejectDraftOrder(order.id, { reason: "Rejetée par l'administrateur" });
      await refetch();
      toast.success('Commande rejetée — stock libéré');
    } catch (e) {
      toast.error(e.response?.data?.message || e.message || 'Erreur');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-6 pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} commande{total !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 border border-gray-200 bg-white px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Actualiser
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-rose-700 transition-colors"
          >
            <Plus size={15} />
            Nouvelle commande
          </button>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => switchTab('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          Toutes les commandes
        </button>
        <button
          onClick={() => switchTab('todo')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'todo'
              ? 'bg-orange-600 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <AlertTriangle size={14} />
          À traiter
          {todoCount > 0 && (
            <span
              className={`text-xs font-bold rounded-full px-1.5 py-0.5 ${
                activeTab === 'todo' ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
              }`}
            >
              {todoCount}
            </span>
          )}
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <StoreFilter
            value={filters.storeId}
            onChange={(v) => updateFilter('storeId', v || '')}
          />
          <input
            type="search"
            placeholder="N°, client, email, téléphone…"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="flex-1 min-w-[200px] border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          {!isTodoView && (
            <>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Tous les statuts</option>
                {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <select
                value={filters.paymentStatus}
                onChange={(e) => updateFilter('paymentStatus', e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Tous les paiements</option>
                {Object.entries(PAYMENT_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </>
          )}
        </div>
        <DateRangeFilter
          from={filters.from}
          to={filters.to}
          onFromChange={(v) => updateFilter('from', v)}
          onToChange={(v) => updateFilter('to', v)}
        />
        <select
          value={filters.destination}
          onChange={(e) => updateFilter('destination', e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Toutes destinations</option>
          <option value="SENEGAL">🇸🇳 Sénégal</option>
          <option value="CONGO_EXPRESS">🇨🇬 Congo Express</option>
          <option value="CONGO_GROUPAGE">🇨🇬 Congo Groupage</option>
        </select>
      </div>

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-6 text-sm">
          {error.message || 'Erreur chargement'} —{' '}
          <button onClick={() => refetch()} className="underline font-medium">Réessayer</button>
        </div>
      )}

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">Chargement…</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="font-medium">
              {isTodoView ? 'Rien à traiter pour le moment 🎉' : 'Aucune commande'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {isTodoView && <th className="px-6 py-3">Urgence</th>}
                  <th className="px-6 py-3">Boutique</th>
                  <th className="px-6 py-3">N° Commande</th>
                  <th className="px-6 py-3">Client</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Paiement</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3">Facture</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const s = STATUS_LABELS[order.status] ?? {
                    label: order.status,
                    color: 'bg-gray-100 text-gray-600',
                  };
                  const isPaid = order.paymentStatus === 'PAID';
                  const waConfirmLink = buildOrderConfirmationWhatsAppLink(order);
                  const urgency = getUrgency(order.reservationExpiresAt);

                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                      {isTodoView && (
                        <td className="px-6 py-4">
                          {urgency ? (
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${urgency.color}`}>
                              <Clock size={11} />
                              {urgency.label}
                            </span>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {order.store?.code || '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-gray-800">
                          {order.orderNumber}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">
                          {order.user
                            ? `${order.user.firstName} ${order.user.lastName}`
                            : order.guestName || '—'}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{order.user?.email || order.guestEmail || ''}</span>
                          {waConfirmLink && (
                            <>
                              <span className="text-gray-300">·</span>
                              <a
                                href={waConfirmLink}
                                target="_blank"
                                rel="noreferrer"
                                title="Envoyer confirmation WhatsApp"
                                className="inline-flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
                              >
                                {WA_ICON}
                                WA
                              </a>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        {formatPrice(order.total || 0)}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className={PAYMENT_COLORS[order.paymentStatus] || 'text-gray-600'}>
                          {PAYMENT_LABELS[order.paymentStatus] || order.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.color}`}>
                          {s.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.invoice ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-gray-600">
                              {order.invoice.invoiceNumber}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(order.invoice)}
                              disabled={downloadingPdf === order.invoice.id}
                              className="p-1 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50"
                              title="Télécharger PDF"
                            >
                              <Download size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {order.status === 'DRAFT' && (
                          <>
                            <button
                              onClick={() => handleConfirmDraft(order)}
                              className="text-xs px-3 py-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 font-medium"
                            >
                              Valider WhatsApp
                            </button>
                            <button
                              onClick={() => handleRejectDraft(order)}
                              className="text-xs px-3 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 font-medium"
                            >
                              Rejeter
                            </button>
                          </>
                        )}
                        {!isPaid && (
                          <button
                            onClick={() => openPaymentModal(order)}
                            className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 font-medium inline-flex items-center gap-1"
                          >
                            <CreditCard size={12} />
                            Paiement
                          </button>
                        )}
                        <button
                          onClick={() => openStatusModal(order)}
                          className="text-xs px-3 py-1.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium"
                        >
                          Changer statut
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      {/* Modal statut commande */}
      {statusModal && selected && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Changer le statut</h2>
              <button onClick={() => setStatusModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Commande <span className="font-mono font-semibold">{selected.orderNumber}</span>
            </p>
            {selected.invoice && (
              <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2 mb-3">
                Facture : {selected.invoice.invoiceNumber}
              </p>
            )}
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3"
            >
              {Object.entries(STATUS_LABELS).map(([val, { label }]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <textarea
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              placeholder="Commentaire (optionnel)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4"
            />
            {selected.statusHistory?.length > 0 && (
              <div className="mb-4 border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Historique récent</p>
                <ul className="space-y-1 max-h-32 overflow-y-auto">
                  {selected.statusHistory.map((h) => (
                    <li key={h.id} className="text-xs text-gray-600">
                      {formatDate(h.createdAt)} — {h.fromStatus ? `${h.fromStatus} → ` : ''}
                      {h.toStatus}
                      {h.message && <span className="text-gray-400"> ({h.message})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex gap-3">
                <button
                  onClick={() => setStatusModal(false)}
                  className="flex-1 border border-gray-200 rounded-lg py-2 text-sm"
                >
                  Annuler
                </button>
                <button
                  onClick={handleStatusChange}
                  disabled={submitting}
                  className="flex-1 bg-black text-white rounded-lg py-2 text-sm disabled:opacity-60"
                >
                  {submitting ? 'En cours…' : 'Confirmer'}
                </button>
              </div>
              {(() => {
                const waLink = buildOrderStatusWhatsAppLink(selected, newStatus);
                return waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-white transition-colors"
                    style={{ background: '#25D366' }}
                  >
                    {WA_ICON}
                    Notifier le client via WhatsApp
                  </a>
                ) : (
                  <p className="text-center text-xs text-gray-400 py-1">
                    Aucun numéro de téléphone sur cette commande
                  </p>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Modal statut paiement */}
      {paymentModal && paymentOrder && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Statut du paiement</h2>
              <button onClick={() => setPaymentModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <p className="text-sm text-gray-500 mb-1">
              Commande <span className="font-mono font-semibold">{paymentOrder.orderNumber}</span>
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Montant : <span className="font-semibold text-gray-900">{formatPrice(paymentOrder.total)}</span>
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[
                { value: 'PAID',     label: '✅ Payé',          color: 'bg-emerald-50 border-emerald-400 text-emerald-700' },
                { value: 'PARTIAL',  label: '🔸 Partiel',       color: 'bg-blue-50 border-blue-400 text-blue-700' },
                { value: 'PENDING',  label: '⏳ En attente',    color: 'bg-yellow-50 border-yellow-400 text-yellow-700' },
                { value: 'REJECTED', label: '❌ Rejeté',        color: 'bg-red-50 border-red-400 text-red-700' },
              ].map(({ value, label, color }) => (
                <button
                  key={value}
                  onClick={() => setPaymentStatus(value)}
                  className={`px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                    paymentStatus === value
                      ? color
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <textarea
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder="Note optionnelle (ex: reçu Mobile Money #123…)"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setPaymentModal(false)}
                className="flex-1 border border-gray-200 rounded-lg py-2 text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handlePaymentStatusChange}
                disabled={submittingPayment}
                className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-60 hover:bg-emerald-700"
              >
                {submittingPayment ? 'En cours…' : 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal création de commande */}
      {showCreateModal && (
        <CreateOrderModal
          storeId={filters.storeId || null}
          onClose={() => setShowCreateModal(false)}
          onCreated={() => refetch()}
        />
      )}
    </div>
  );
}