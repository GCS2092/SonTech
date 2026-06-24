import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Search, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin.api';
import { settingsApi } from '../../api/settings.api';
import Pagination from '../../components/shared/Pagination';
import DateRangeFilter from '../../components/admin/DateRangeFilter';
import StoreFilter from '../../components/admin/StoreFilter';

const formatPrice = (p) => `${Number(p || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const STATUS_STYLES = {
  GENERATED: 'bg-blue-50 text-blue-700',
  SENT: 'bg-indigo-50 text-indigo-700',
  PAID: 'bg-emerald-50 text-emerald-700',
  CANCELLED: 'bg-red-50 text-red-700',
};

const STATUS_LABELS = {
  GENERATED: 'Generee',
  SENT: 'Envoyee',
  PAID: 'Payee',
  CANCELLED: 'Annulee',
};

// ---------------------------------------------------------------------------
// Helper — construit le message WhatsApp pour envoyer la facture au client
// ---------------------------------------------------------------------------
const buildInvoiceWhatsAppMessage = ({ inv, clientName }) => {
  const lines = [];
  lines.push(`*Facture SonShop*`);
  lines.push(`N° Facture : *${inv.invoiceNumber}*`);
  lines.push(`Commande : ${inv.order?.orderNumber || '-'}`);
  lines.push('');
  lines.push(`Client : ${clientName}`);
  lines.push(`Date : ${formatDate(inv.issuedAt)}`);
  lines.push(`*Total : ${formatPrice(inv.total)}*`);
  lines.push('');
  lines.push(`Statut : ${STATUS_LABELS[inv.status] || inv.status}`);
  lines.push('');
  lines.push(`Merci pour votre commande ! Pour toute question, repondez a ce message.`);
  return encodeURIComponent(lines.join('\n'));
};

export default function AdminInvoices() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);
  const [storeId, setStoreId] = useState('');
  const [downloading, setDownloading] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(null);

  const filterParams = {
    page,
    limit: 20,
    ...(search.trim() && { search: search.trim() }),
    ...(status && { status }),
    ...(from && { from }),
    ...(to && { to }),
    ...(storeId && { storeId }),
  };

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-invoices', filterParams],
    queryFn: () => adminApi.getInvoices(filterParams).then((r) => r.data),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getPublic().then((r) => r.data),
  });

  const invoices = data?.data || [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getClientName = (inv) => {
    const o = inv.order;
    if (!o) return '-';
    if (o.user) return `${o.user.firstName} ${o.user.lastName}`;
    return o.guestName || '-';
  };

  // Recupere le numero de telephone du client depuis la commande
  const getClientPhone = (inv) => {
    const o = inv.order;
    if (!o) return null;
    const phone =
      o.shippingAddress?.phone ||
      o.user?.phone ||
      o.guestPhone ||
      null;
    if (!phone) return null;
    // Nettoie le numero : garde uniquement les chiffres, ajoute 221 si numero local senegalais
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('221')) return digits;
    if (digits.length === 9) return `221${digits}`;
    return digits;
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleDownload = async (invoice) => {
    setDownloading(invoice.id);
    try {
      await adminApi.downloadInvoicePdf(invoice.id, invoice.invoiceNumber);
      toast.success('Facture telechargee');
    } catch (e) {
      toast.error(e.message || 'Erreur telechargement');
    } finally {
      setDownloading(null);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const { page: _p, limit: _l, ...exportFilters } = filterParams;
      await adminApi.exportInvoicesExcel(exportFilters);
      toast.success('Export Excel telecharge');
    } catch (e) {
      toast.error(e.message || 'Erreur export');
    } finally {
      setExporting(false);
    }
  };

  const handleSendWhatsApp = (inv) => {
    const clientPhone = getClientPhone(inv);

    if (!clientPhone) {
      toast.error('Aucun numero de telephone trouve pour ce client.');
      return;
    }

    setSendingWhatsApp(inv.id);

    const message = buildInvoiceWhatsAppMessage({
      inv,
      clientName: getClientName(inv),
    });

    window.open(`https://wa.me/${clientPhone}?text=${message}`, '_blank');
    toast.success(`Facture envoyee via WhatsApp a ${clientPhone}`);
    setSendingWhatsApp(null);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText size={16} className="text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Comptabilite</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Factures</h1>
          <p className="text-stone-500 text-sm mt-1">{total} facture(s)</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            disabled={exporting || total === 0}
            className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100 disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            {exporting ? 'Export...' : 'Export Excel'}
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2 rounded-xl text-sm text-stone-600 hover:bg-stone-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <StoreFilter value={storeId} onChange={(v) => { setStoreId(v || ''); setPage(1); }} />
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="N° facture, commande, client..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(v) => { setFrom(v); setPage(1); }}
          onToChange={(v) => { setTo(v); setPage(1); }}
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400">Chargement...</div>
        ) : invoices.length === 0 ? (
          <div className="py-20 text-center text-stone-400">
            <FileText size={40} className="mx-auto mb-3 opacity-30" />
            <p>Aucune facture pour ces criteres.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase">
                  <th className="px-5 py-3">N° Facture</th>
                  <th className="px-5 py-3">Commande</th>
                  <th className="px-5 py-3">Client</th>
                  <th className="px-5 py-3">Telephone</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoices.map((inv) => {
                  const clientPhone = getClientPhone(inv);
                  return (
                    <tr key={inv.id} className="hover:bg-stone-50">
                      <td className="px-5 py-4 font-mono text-xs font-semibold">{inv.invoiceNumber}</td>
                      <td className="px-5 py-4 font-mono text-xs">{inv.order?.orderNumber || '-'}</td>
                      <td className="px-5 py-4">{getClientName(inv)}</td>
                      <td className="px-5 py-4 text-stone-500 text-xs font-mono">
                        {clientPhone ? `+${clientPhone}` : <span className="text-stone-300">-</span>}
                      </td>
                      <td className="px-5 py-4 text-stone-600">{formatDate(inv.issuedAt)}</td>
                      <td className="px-5 py-4 font-semibold">{formatPrice(inv.total)}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            STATUS_STYLES[inv.status] || 'bg-stone-100'
                          }`}
                        >
                          {STATUS_LABELS[inv.status] || inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* Bouton PDF */}
                          <button
                            onClick={() => handleDownload(inv)}
                            disabled={downloading === inv.id}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 disabled:opacity-50"
                          >
                            <Download size={13} />
                            {downloading === inv.id ? '...' : 'PDF'}
                          </button>

                          {/* Bouton WhatsApp */}
                          <button
                            onClick={() => handleSendWhatsApp(inv)}
                            disabled={sendingWhatsApp === inv.id || !clientPhone}
                            title={!clientPhone ? 'Aucun telephone disponible' : 'Envoyer la facture par WhatsApp'}
                            className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            {sendingWhatsApp === inv.id ? '...' : 'WA'}
                          </button>
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

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
