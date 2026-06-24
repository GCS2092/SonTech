import { useState, useEffect } from 'react';
import useAuthStore from '../../store/authStore';
import { adminApi } from '../../api/admin.api';
import { API_URL } from '../../utils/constants';
import StoreFilter from '../../components/admin/StoreFilter';
import { toast } from 'sonner';
import {
  TrendingUp, Package, ShoppingBag, Users,
  AlertTriangle, Clock, Download, Mail, FileText,
  ArrowUpRight, BarChart3
} from 'lucide-react';

const formatPrice = (p) => `${Number(p || 0).toLocaleString('fr-FR')} FCFA`;
const formatDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });

const STATUS_CONFIG = {
  DRAFT:      { label: 'Brouillon WA',  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', dot: 'bg-orange-400' },
  PENDING:    { label: 'En attente',    color: 'text-amber-600',  bg: 'bg-amber-50  border-amber-200',  dot: 'bg-amber-400' },
  CONFIRMED:  { label: 'Confirmée',     color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-200',   dot: 'bg-blue-400' },
  PROCESSING: { label: 'En traitement', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-200', dot: 'bg-violet-400' },
  SHIPPED:    { label: 'Expédiée',      color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-200', dot: 'bg-indigo-400' },
  DELIVERED:  { label: 'Livrée',        color: 'text-emerald-600',bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-400' },
  CANCELLED:  { label: 'Annulée',       color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    dot: 'bg-red-400' },
};

// ─── Mini bar chart ───────────────────────────────────────────────────────────
function MiniBarChart({ data, color = 'bg-rose-400' }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((v, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm ${color} transition-all duration-500`}
          style={{ height: `${Math.max(8, (v / max) * 100)}%`, opacity: i === data.length - 1 ? 1 : 0.4 + (i / data.length) * 0.5 }}
        />
      ))}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, trend, chartData, color, delay = 0 }) {
  return (
    <div
      className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={18} className="text-white" />
        </div>
        {trend !== undefined && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
            <ArrowUpRight size={10} className={trend < 0 ? 'rotate-180' : ''} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mb-1">
        <div className="text-2xl font-bold text-stone-900 tabular-nums">{value}</div>
        <div className="text-xs text-stone-500 mt-0.5">{label}</div>
      </div>
      {chartData && <MiniBarChart data={chartData} color={color.replace('bg-', 'bg-').split(' ')[0]} />}
      {sub && <div className="text-xs text-stone-400 mt-2">{sub}</div>}
    </div>
  );
}

// ─── Report Downloader ────────────────────────────────────────────────────────
function ReportDownloader({ storeId, token }) {
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo]     = useState(today);
  const [loadingPdf,   setLoadingPdf]   = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const handleDownload = async () => {
    if (!storeId) return toast.error('Sélectionnez une boutique d\'abord');
    setLoadingPdf(true);
    try {
      const params = new URLSearchParams({ storeId, from, to }).toString();
      const res = await fetch(`${API_URL}/api/admin/reports/download?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `rapport-${from}-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport PDF téléchargé');
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleEmail = async () => {
    if (!storeId) return toast.error('Sélectionnez une boutique d\'abord');
    setLoadingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/reports/send-email`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ storeId, from, to }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || 'Rapport envoyé par email');
    } catch (e) {
      toast.error(e.message || "Erreur lors de l'envoi");
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-100 flex items-center gap-2">
        <FileText size={15} className="text-rose-500" />
        <h2 className="font-semibold text-stone-900 text-sm">Rapport de gestion</h2>
      </div>

      <div className="px-5 py-4 flex flex-wrap gap-3 items-end">
        {/* Date range */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Du</label>
          <input
            type="date"
            value={from}
            max={to}
            onChange={e => setFrom(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Au</label>
          <input
            type="date"
            value={to}
            min={from}
            onChange={e => setTo(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleDownload}
            disabled={loadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-all"
          >
            <Download size={14} />
            {loadingPdf ? 'Génération…' : 'Télécharger PDF'}
          </button>
          <button
            onClick={handleEmail}
            disabled={loadingEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed text-stone-700 text-sm font-medium transition-all"
          >
            <Mail size={14} />
            {loadingEmail ? 'Envoi…' : 'Envoyer par email'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { token, user } = useAuthStore();
  const [storeId, setStoreId] = useState('');
  const [data, setData] = useState({ orders: [], products: [], categories: [], users: [] });
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const orderParams = { limit: 100, ...(storeId && { storeId }) };
        const [oRes, pRes, cRes, uRes] = await Promise.all([
          adminApi.getOrders(orderParams),
          fetch(`${API_URL}/api/products?limit=100`),
          fetch(`${API_URL}/api/categories`),
          fetch(`${API_URL}/api/users`, { headers }),
        ]);
        const [pData, cData, uData] = await Promise.all([
          pRes.json(), cRes.json(), uRes.json()
        ]);
        setData({
          orders:     oRes.data?.data || [],
          products:   Array.isArray(pData) ? pData : pData.data || [],
          categories: Array.isArray(cData) ? cData : cData.data || [],
          users:      Array.isArray(uData) ? uData : uData.data || [],
        });
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [storeId]);

  const totalRevenue = data.orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((sum, o) => sum + Number(o.total || o.totalAmount || 0), 0);

  const pendingOrders     = data.orders.filter(o => o.status === 'PENDING');
  const lowStockProducts  = data.products.filter((p) => {
    const available = (p.stock || 0) - (p.reservedStock || 0);
    return available <= (p.lowStockAlert ?? 5);
  });
  const recentOrders = [...data.orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

  const orderChart   = [2, 5, 3, 8, 6, 4, 9, 7, 11, data.orders.length];
  const revenueChart = [1, 3, 2, 6, 4, 5, 8, 6, 9, Math.min(10, Math.floor(totalRevenue / 10000))];

  const statusBreakdown = Object.entries(STATUS_CONFIG).map(([key, cfg]) => ({
    key, ...cfg,
    count: data.orders.filter(o => o.status === key).length,
  })).filter(s => s.count > 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-stone-500">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8 pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 size={18} className="text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Vue d'ensemble</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
            Bonjour{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <StoreFilter value={storeId} onChange={setStoreId} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <StatCard label="Revenus livrés" value={formatPrice(totalRevenue)} icon={TrendingUp}
          color="bg-rose-500" chartData={revenueChart} trend={12} delay={0} />
        <StatCard label="Commandes" value={data.orders.length} icon={ShoppingBag}
          color="bg-violet-500" chartData={orderChart} trend={8} delay={100} />
        <StatCard label="Produits" value={data.products.length} icon={Package}
          color="bg-blue-500" sub={`${lowStockProducts.length} en stock faible`} delay={200} />
        <StatCard label="Clients" value={data.users.length} icon={Users}
          color="bg-emerald-500" trend={5} delay={300} />
      </div>

      {/* Alerts */}
      {(pendingOrders.length > 0 || lowStockProducts.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {pendingOrders.length > 0 && (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-amber-600" />
              </div>
              <div>
                <div className="font-semibold text-amber-800 text-sm">{pendingOrders.length} commande{pendingOrders.length > 1 ? 's' : ''} en attente</div>
                <div className="text-xs text-amber-600">À traiter rapidement</div>
              </div>
            </div>
          )}
          {lowStockProducts.length > 0 && (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={16} className="text-red-600" />
              </div>
              <div>
                <div className="font-semibold text-red-800 text-sm">{lowStockProducts.length} produit{lowStockProducts.length > 1 ? 's' : ''} en stock faible</div>
                <div className="text-xs text-red-600">Stock ≤ 5 unités</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Report downloader */}
      <div className="mb-6">
        <ReportDownloader storeId={storeId} token={token} />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between">
            <h2 className="font-semibold text-stone-900">Dernières commandes</h2>
            <span className="text-xs text-stone-400">{recentOrders.length} récentes</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-stone-400 text-sm">Aucune commande</div>
          ) : (
            <div className="divide-y divide-stone-50">
              {recentOrders.map((o) => {
                const s = STATUS_CONFIG[o.status] || { label: o.status, bg: 'bg-stone-50 border-stone-200', dot: 'bg-stone-400', color: 'text-stone-600' };
                return (
                  <div key={o.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-stone-50/50 transition-colors">
                    <div className={`w-1.5 h-8 rounded-full ${s.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-stone-800">
                          {o.orderNumber || o.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold border ${s.bg} ${s.color}`}>
                          {s.label}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 mt-0.5 truncate">
                        {o.user?.name || o.user?.email || 'Client'} · {formatDate(o.createdAt)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-stone-900 shrink-0">
                      {formatPrice(o.total || o.totalAmount || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Order status breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">Statuts commandes</h2>
            </div>
            {statusBreakdown.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-sm">Aucune donnée</div>
            ) : (
              <div className="p-4 space-y-2.5">
                {statusBreakdown.map((s) => {
                  const pct = data.orders.length > 0 ? Math.round((s.count / data.orders.length) * 100) : 0;
                  return (
                    <div key={s.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                          <span className="text-xs text-stone-600">{s.label}</span>
                        </div>
                        <span className="text-xs font-bold text-stone-800">{s.count}</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${s.dot} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-stone-100">
              <h2 className="font-semibold text-stone-900">Catégories</h2>
            </div>
            <div className="divide-y divide-stone-50">
              {data.categories.slice(0, 5).map((c) => {
                const count = data.products.filter(p => p.categoryId === c.id).length;
                return (
                  <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-8 h-8 rounded-lg object-cover border border-stone-100 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-stone-100 shrink-0" />
                    )}
                    <span className="text-sm text-stone-700 flex-1 truncate font-medium">{c.name}</span>
                    <span className="text-xs font-semibold text-stone-400 shrink-0">{count} produits</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}