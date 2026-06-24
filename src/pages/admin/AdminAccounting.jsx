// frontend/src/pages/admin/AdminAccounting.jsx

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { accountingApi } from '../../api/accounting.api';

// ─── Utilitaires ───────────────────────────────────────────────
const fmt = (amount) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 })
    .format(amount || 0);

const pct = (v) => `${v ?? '—'}%`;

const fmtPDF = (amount) => {
  if (amount == null || isNaN(amount)) return '0 FCFA';
  return (
    new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })
      .format(amount)
      .replace(/\u202f/g, ' ')
      .replace(/\u00a0/g, ' ')
    + ' FCFA'
  );
};

const pctPDF = (v) => (v != null ? `${v}%` : '—');

const EXPENSE_CATEGORIES = [
  { value: 'STOCK_PURCHASE', label: 'Achat stock' },
  { value: 'SHIPPING',       label: 'Livraison / transport' },
  { value: 'MARKETING',      label: 'Marketing' },
  { value: 'PACKAGING',      label: 'Emballages' },
  { value: 'SALARY',         label: 'Salaires' },
  { value: 'RENT',           label: 'Loyer' },
  { value: 'UTILITIES',      label: 'Charges (eau, élec…)' },
  { value: 'OTHER',          label: 'Autres' },
];

const MOVEMENT_TYPES = [
  { value: 'IN',         label: 'Entrée stock',       color: 'text-emerald-600' },
  { value: 'OUT_SALE',   label: 'Vente',              color: 'text-blue-600' },
  { value: 'OUT_LOSS',   label: 'Perte / casse',      color: 'text-red-500' },
  { value: 'OUT_RETURN', label: 'Retour fournisseur', color: 'text-amber-600' },
  { value: 'ADJUSTMENT', label: 'Ajustement',         color: 'text-violet-600' },
  { value: 'RETURN_IN',  label: 'Retour client',      color: 'text-teal-600' },
];

const PIE_COLORS = ['#6366f1','#ec4899','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#14b8a6'];

const IS_INCOMING = (type) => ['IN', 'RETURN_IN', 'ADJUSTMENT'].includes(type);

// ─── Export PDF ────────────────────────────────────────────────
const exportPDF = async (dashboard, period, year, month) => {
  try {
    const { default: jsPDF }    = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    const periodLabel = period === 'month'
      ? `${['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'][month - 1]} ${year}`
      : period === 'year' ? `Annee ${year}` : 'Toute la periode';

    doc.setFillColor(99, 102, 241);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SonShop - Rapport Comptable', 14, 13);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Periode : ${periodLabel}   -   Genere le ${new Date().toLocaleDateString('fr-FR')}`, 14, 22);

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Resume financier', 14, 38);

    autoTable(doc, {
      startY: 42,
      head: [['Indicateur', 'Valeur']],
      body: [
        ["Chiffre d'affaires", fmtPDF(dashboard.revenue)],
        ['Commandes', String(dashboard.orderCount ?? 0)],
        ['Panier moyen', fmtPDF(dashboard.avgOrderValue)],
        ['Cout des marchandises vendues (CMV)', fmtPDF(dashboard.cogs)],
        ['Benefice brut', fmtPDF(dashboard.grossProfit)],
        ['Marge brute', pctPDF(dashboard.grossMargin)],
        ['Depenses operationnelles', fmtPDF(dashboard.expenses)],
        ['Benefice net', fmtPDF(dashboard.netProfit)],
      ],
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Stock', 14, doc.lastAutoTable.finalY + 12);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 16,
      head: [['Indicateur', 'Valeur']],
      body: [
        ['Valeur stock (prix achat)',   fmtPDF(dashboard.stockValue)],
        ['Valeur stock (prix vente)',   fmtPDF(dashboard.stockRetailValue)],
        ['Marge potentielle stock',     pctPDF(dashboard.stockMargin)],
      ],
      headStyles: { fillColor: [139, 92, 246], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 245, 255] },
      styles: { fontSize: 10 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
    });

    if (dashboard.lowStockProducts?.length > 0) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Alertes stock bas', 14, doc.lastAutoTable.finalY + 12);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 16,
        head: [['Produit', 'Stock restant']],
        body: dashboard.lowStockProducts.map((p) => [p.name, p.stock === 0 ? 'RUPTURE' : `${p.stock} restants`]),
        headStyles: { fillColor: [239, 68, 68], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        styles: { fontSize: 10 },
      });
    }

    if (dashboard.revenueChart?.length > 0) {
      doc.addPage();
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 30, 30);
      doc.text('Evolution du CA - 6 derniers mois', 14, 20);
      autoTable(doc, {
        startY: 24,
        head: [["Mois", "Chiffre d'affaires"]],
        body: dashboard.revenueChart.map((r) => [r.month, fmtPDF(r.revenue)]),
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [245, 245, 255] },
        styles: { fontSize: 10 },
        columnStyles: { 1: { halign: 'right' } },
      });
    }

    doc.save(`rapport-comptable-${periodLabel.replace(/\s/g, '-')}.pdf`);
    toast.success('Rapport PDF exporté !');
  } catch (err) {
    console.error(err);
    toast.error('Installer jspdf et jspdf-autotable : npm install jspdf jspdf-autotable');
  }
};

// ─── Composants UI ─────────────────────────────────────────────
function KpiCard({ label, value, sub, variant = 'default', icon }) {
  const variants = {
    default: 'bg-white border-slate-200 text-slate-700',
    blue:    'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400 text-white',
    green:   'bg-gradient-to-br from-emerald-500 to-emerald-600 border-emerald-400 text-white',
    red:     'bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white',
    amber:   'bg-gradient-to-br from-amber-400 to-amber-500 border-amber-300 text-white',
    purple:  'bg-gradient-to-br from-violet-500 to-violet-600 border-violet-400 text-white',
    teal:    'bg-gradient-to-br from-teal-500 to-teal-600 border-teal-400 text-white',
  };
  const isColored = variant !== 'default';
  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${variants[variant]} transition-transform hover:-translate-y-0.5 hover:shadow-md`}>
      <div className="flex items-start justify-between mb-3">
        <span className={`text-xs font-semibold uppercase tracking-widest ${isColored ? 'opacity-80' : 'text-slate-400'}`}>{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${isColored ? '' : 'text-slate-800'}`}>{value}</div>
      {sub && <div className={`text-xs mt-1.5 ${isColored ? 'opacity-75' : 'text-slate-400'}`}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-5">
      <h2 className="text-lg font-bold text-slate-800">{title}</h2>
      {action}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors text-lg">✕</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Badge({ children, color = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200',
    green:  'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    red:    'bg-red-50 text-red-700 ring-1 ring-red-200',
    amber:  'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    slate:  'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
  };
  return <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${colors[color] ?? colors.indigo}`}>{children}</span>;
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-indigo-600 font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Page principale ────────────────────────────────────────────
export default function AdminAccounting() {
  const [tab, setTab] = useState('dashboard');
  const [period, setPeriod] = useState('month');
  const [year,   setYear]   = useState(new Date().getFullYear());
  const [month,  setMonth]  = useState(new Date().getMonth() + 1);

  const [showExpenseModal,  setShowExpenseModal]  = useState(false);
  const [showStockModal,    setShowStockModal]    = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier,   setEditingSupplier]   = useState(null);

  const [stockMovementType, setStockMovementType] = useState('IN');

  const [filterProduct, setFilterProduct] = useState('');
  const [filterType,    setFilterType]    = useState('');
  const [filterDate,    setFilterDate]    = useState('');

  const qc = useQueryClient();

  // ── Queries ─────────────────────────────────────────────────
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['accounting-dashboard', period, year, month],
    queryFn:  () => accountingApi.getDashboard({ period, year, month }).then((r) => r.data),
  });

  const { data: expenses } = useQuery({
    queryKey: ['accounting-expenses'],
    queryFn:  () => accountingApi.getExpenses({ limit: 50 }).then((r) => r.data),
    enabled:  tab === 'expenses',
  });

  const { data: stockMovements } = useQuery({
    queryKey: ['accounting-stock'],
    queryFn:  () => accountingApi.getStockMovements({ limit: 50 }).then((r) => r.data),
    enabled:  tab === 'stock',
  });

  const { data: margins } = useQuery({
    queryKey: ['accounting-margins'],
    queryFn:  () => accountingApi.getProductMargins().then((r) => r.data),
    enabled:  tab === 'margins',
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers'],
    queryFn:  () => accountingApi.getSuppliers().then((r) => r.data),
  });

  const { data: allSuppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn:  () => accountingApi.getAllSuppliers().then((r) => r.data),
    enabled:  tab === 'suppliers',
  });

  const { data: productsData } = useQuery({
    queryKey: ['admin-products-select'],
    queryFn:  () => accountingApi.getAdminProducts().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });
  const products = productsData?.products ?? productsData?.data ?? productsData ?? [];

  // ── Mutations ────────────────────────────────────────────────
  const createExpenseMutation = useMutation({
    mutationFn: accountingApi.createExpense,
    onSuccess: () => {
      toast.success('Dépense enregistrée');
      qc.invalidateQueries({ queryKey: ['accounting-expenses'] });
      qc.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      setShowExpenseModal(false);
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: accountingApi.deleteExpense,
    onSuccess: () => {
      toast.success('Dépense supprimée');
      qc.invalidateQueries({ queryKey: ['accounting-expenses'] });
      qc.invalidateQueries({ queryKey: ['accounting-dashboard'] });
    },
  });

  const createStockMutation = useMutation({
    mutationFn: accountingApi.createStockMovement,
    onSuccess: () => {
      toast.success('Mouvement de stock enregistré');
      qc.invalidateQueries({ queryKey: ['accounting-stock'] });
      qc.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-products-select'] });
      setShowStockModal(false);
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const cancelStockMutation = useMutation({
    mutationFn: accountingApi.cancelStockMovement,
    onSuccess: () => {
      toast.success('Mouvement annulé — mouvement inverse créé');
      qc.invalidateQueries({ queryKey: ['accounting-stock'] });
      qc.invalidateQueries({ queryKey: ['accounting-dashboard'] });
      qc.invalidateQueries({ queryKey: ['admin-products-select'] });
    },
    onError: (err) => {
      const msg = err?.response?.data?.error || "Erreur lors de l'annulation";
      toast.error(msg);
    },
  });

  const createSupplierMutation = useMutation({
    mutationFn: accountingApi.createSupplier,
    onSuccess: () => {
      toast.success('Fournisseur ajouté');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
      setShowSupplierModal(false);
      setEditingSupplier(null);
    },
    onError: () => toast.error("Erreur lors de la création"),
  });

  const updateSupplierMutation = useMutation({
    mutationFn: ({ id, data }) => accountingApi.updateSupplier(id, data),
    onSuccess: () => {
      toast.success('Fournisseur mis à jour');
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
      setShowSupplierModal(false);
      setEditingSupplier(null);
    },
    onError: () => toast.error("Erreur lors de la mise à jour"),
  });

  const toggleSupplierMutation = useMutation({
    mutationFn: accountingApi.toggleSupplier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['suppliers'] });
      qc.invalidateQueries({ queryKey: ['suppliers-all'] });
    },
    onError: () => toast.error("Erreur lors du changement de statut"),
  });

  // ── Handlers ─────────────────────────────────────────────────
  const handleExpenseSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createExpenseMutation.mutate({
      category:   fd.get('category'),
      label:      fd.get('label'),
      amount:     parseFloat(fd.get('amount')),
      date:       fd.get('date'),
      supplierId: fd.get('supplierId') || null,
      reference:  fd.get('reference')  || null,
      notes:      fd.get('notes')      || null,
    });
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const unitCostRaw = fd.get('unitCost');
    createStockMutation.mutate({
      productId:  fd.get('productId'),
      type:       fd.get('type'),
      quantity:   parseInt(fd.get('quantity'), 10),
      unitCost:   unitCostRaw ? parseFloat(unitCostRaw) : null,
      reason:     fd.get('reason')     || null,
      supplierId: fd.get('supplierId') || null,
      reference:  fd.get('reference')  || null,
    });
  };

  const handleSupplierSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const data = {
      name:    fd.get('name'),
      email:   fd.get('email')   || null,
      phone:   fd.get('phone')   || null,
      address: fd.get('address') || null,
    };
    if (editingSupplier) {
      updateSupplierMutation.mutate({ id: editingSupplier.id, data });
    } else {
      createSupplierMutation.mutate(data);
    }
  };

  // ── Config ────────────────────────────────────────────────────
  const tabs = [
    { id: 'dashboard', label: '📊 Tableau de bord' },
    { id: 'expenses',  label: '💸 Dépenses' },
    { id: 'stock',     label: '📦 Stock' },
    { id: 'margins',   label: '📈 Marges' },
    { id: 'suppliers', label: '🏭 Fournisseurs' },
  ];

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all bg-slate-50 focus:bg-white';
  const labelCls = 'block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide';

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Comptabilité</h1>
          <p className="text-sm text-slate-400 mt-0.5">Suivi financier, stock et bénéfices</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="all">Tout</option>
          </select>
          {period === 'month' && (<>
            <select value={month} onChange={(e) => setMonth(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
              {['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select value={year} onChange={(e) => setYear(Number(e.target.value))}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
              {[2023, 2024, 2025, 2026].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </>)}
          {tab === 'dashboard' && dashboard && (
            <button onClick={() => exportPDF(dashboard, period, year, month)}
              className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h4a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              </svg>
              Exporter PDF
            </button>
          )}
          {tab === 'suppliers' && (
            <button onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm">
              + Nouveau fournisseur
            </button>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 min-w-max px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════
          TAB: DASHBOARD
      ══════════════════════════════════════════ */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
              <span className="text-slate-400 text-sm">Chargement…</span>
            </div>
          ) : dashboard ? (<>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard label="Chiffre d'affaires" value={fmt(dashboard.revenue)} variant="blue" icon="💰"
                sub={`${dashboard.orderCount} commande${dashboard.orderCount !== 1 ? 's' : ''}`} />
              <KpiCard label="Bénéfice brut" value={fmt(dashboard.grossProfit)} icon="📈"
                variant={dashboard.grossProfit >= 0 ? 'green' : 'red'}
                sub={`Marge ${pct(dashboard.grossMargin)}`} />
              <KpiCard label="Dépenses" value={fmt(dashboard.expenses)} variant="amber" icon="💸" />
              <KpiCard label="Bénéfice net" value={fmt(dashboard.netProfit)} icon="✅"
                variant={dashboard.netProfit >= 0 ? 'green' : 'red'}
                sub="Après toutes dépenses" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <KpiCard label="Valeur stock (achat)" value={fmt(dashboard.stockValue)} variant="purple" icon="📦"
                sub={`Vente potentielle : ${fmt(dashboard.stockRetailValue)}`} />
              <KpiCard label="Marge potentielle stock" value={pct(dashboard.stockMargin)} variant="teal" icon="📊" />
              <KpiCard label="Panier moyen" value={fmt(dashboard.avgOrderValue)} icon="🛒" />
            </div>

            {dashboard.revenueChart && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-5 uppercase tracking-wide">Évolution CA — 6 derniers mois</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={dashboard.revenueChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#6366f1' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dashboard.expensesByCategory?.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                  <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Dépenses par catégorie</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={dashboard.expensesByCategory.map((d) => ({
                          name: EXPENSE_CATEGORIES.find((c) => c.value === d.category)?.label || d.category,
                          value: d._sum.amount,
                        }))}
                        cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" nameKey="name">
                        {dashboard.expensesByCategory.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">⚠️ Alertes stock bas</h3>
                {dashboard.lowStockProducts?.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 gap-2">
                    <span className="text-3xl">✅</span>
                    <p className="text-sm text-slate-400">Tous les stocks sont suffisants</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dashboard.lowStockProducts?.map((p) => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-sm text-slate-700 truncate mr-2">{p.name}</span>
                        <Badge color={p.stock === 0 ? 'red' : 'amber'}>
                          {p.stock === 0 ? 'Rupture' : `${p.stock} restants`}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wide">Résumé comptable de la période</h3>
              <div className="space-y-3 text-sm max-w-md">
                {[
                  { label: "Chiffre d'affaires (CA)",        value: fmt(dashboard.revenue),     cls: 'text-slate-800' },
                  { label: '— Coût des marchandises (CMV)',   value: `- ${fmt(dashboard.cogs)}`, cls: 'text-red-500' },
                  { label: '= Bénéfice brut',                value: fmt(dashboard.grossProfit), cls: 'font-semibold text-slate-800 border-t border-slate-200 pt-3 mt-1' },
                  { label: '— Dépenses opérationnelles',     value: `- ${fmt(dashboard.expenses)}`, cls: 'text-red-500' },
                  { label: '= Bénéfice net',                 value: fmt(dashboard.netProfit),   cls: `font-extrabold text-base border-t border-slate-200 pt-3 mt-1 ${dashboard.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}` },
                ].map((row, i) => (
                  <div key={i} className={`flex justify-between ${row.cls}`}>
                    <span>{row.label}</span>
                    <span>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </>) : (
            <div className="text-center py-20 text-slate-400">Aucune donnée disponible</div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: DÉPENSES
      ══════════════════════════════════════════ */}
      {tab === 'expenses' && (
        <div>
          <SectionHeader
            title="Dépenses"
            action={
              <button onClick={() => setShowExpenseModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <span className="text-lg leading-none">+</span> Ajouter une dépense
              </button>
            }
          />
          {/* ↓ overflow-x-auto + min-w sur la table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date', 'Catégorie', 'Libellé', 'Fournisseur', 'Référence', 'Montant', ''].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {expenses?.expenses?.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{new Date(exp.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Badge color="indigo">{EXPENSE_CATEGORIES.find((c) => c.value === exp.category)?.label}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800 font-medium">{exp.label}</td>
                    <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap">{exp.supplier?.name || '—'}</td>
                    <td className="px-4 py-3.5 text-slate-300 font-mono text-xs whitespace-nowrap">{exp.reference || '—'}</td>
                    <td className="px-4 py-3.5 font-bold text-red-500 whitespace-nowrap">{fmt(exp.amount)}</td>
                    <td className="px-4 py-3.5">
                      <button onClick={() => deleteExpenseMutation.mutate(exp.id)}
                        className="text-xs text-slate-300 hover:text-red-500 transition-colors font-medium whitespace-nowrap">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
                {!expenses?.expenses?.length && (
                  <tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">Aucune dépense enregistrée</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: STOCK
      ══════════════════════════════════════════ */}
      {tab === 'stock' && (
        <div>
          <SectionHeader
            title="Mouvements de stock"
            action={
              <button onClick={() => setShowStockModal(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
                <span className="text-lg leading-none">+</span> Enregistrer un mouvement
              </button>
            }
          />

          {/* ── Filtres ── */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none">
              <option value="">Tous les types</option>
              {MOVEMENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>

            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none min-w-[180px]">
              <option value="">Tous les produits</option>
              {Array.isArray(products) && products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />

            {(filterType || filterProduct || filterDate) && (
              <button
                onClick={() => { setFilterType(''); setFilterProduct(''); setFilterDate(''); }}
                className="text-sm text-slate-400 hover:text-slate-600 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors">
                ✕ Réinitialiser
              </button>
            )}
          </div>

          {/* ↓ overflow-x-auto + min-w sur la table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Date','Produit','Type','Quantité','Coût unitaire','Coût total','Fournisseur','Référence','Motif',''].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(() => {
                  const now = Date.now();
                  const filtered = (stockMovements?.movements ?? []).filter((m) => {
                    if (filterType    && m.type      !== filterType)    return false;
                    if (filterProduct && m.productId !== filterProduct) return false;
                    if (filterDate) {
                      const mDate = new Date(m.createdAt).toISOString().split('T')[0];
                      if (mDate !== filterDate) return false;
                    }
                    return true;
                  });

                  if (!filtered.length) return (
                    <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-400">
                      {filterType || filterProduct || filterDate
                        ? 'Aucun mouvement pour ces filtres'
                        : 'Aucun mouvement enregistré'}
                    </td></tr>
                  );

                  return filtered.map((m) => {
                    const typeInfo  = MOVEMENT_TYPES.find((t) => t.value === m.type);
                    const isIn      = IS_INCOMING(m.type);
                    const ageHours  = (now - new Date(m.createdAt).getTime()) / 3_600_000;
                    const isCancel  = m.reference?.startsWith('CANCEL:');
                    const canCancel = !isCancel && ageHours <= 24;

                    return (
                      <tr key={m.id} className={`hover:bg-slate-50 transition-colors ${isCancel ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(m.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                        <td className="px-4 py-3.5 text-slate-800 font-medium max-w-[160px] truncate">{m.product?.name}</td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className={`text-xs font-semibold ${typeInfo?.color}`}>
                            {isCancel ? '↩ ' : ''}{typeInfo?.label}
                          </span>
                        </td>
                        <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${isIn ? 'text-emerald-600' : 'text-red-500'}`}>
                          {isIn ? '+' : '-'}{m.quantity}
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{m.unitCost  ? fmt(m.unitCost)  : '—'}</td>
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{m.totalCost ? fmt(m.totalCost) : '—'}</td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs whitespace-nowrap">{m.supplier?.name || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-300 font-mono text-xs whitespace-nowrap">{m.reference || '—'}</td>
                        <td className="px-4 py-3.5 text-slate-400 text-xs">{m.reason || '—'}</td>
                        <td className="px-4 py-3.5">
                          {canCancel && (
                            <button
                              onClick={() => {
                                if (window.confirm(`Annuler ce mouvement ? Un mouvement inverse sera créé automatiquement.`)) {
                                  cancelStockMutation.mutate(m.id);
                                }
                              }}
                              disabled={cancelStockMutation.isPending}
                              className="text-xs text-slate-300 hover:text-amber-500 transition-colors font-medium whitespace-nowrap disabled:opacity-50">
                              ↩ Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: MARGES
      ══════════════════════════════════════════ */}
      {tab === 'margins' && (
        <div>
          <SectionHeader title="Marges par produit" />
          {/* ↓ overflow-x-auto + min-w sur la table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[960px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {['Produit', 'Catégorie', 'Prix vente', 'Prix achat', 'Stock', 'Valeur stock', 'Vendus', 'CA généré', 'Bén. brut', 'Marge'].map((h) => (
                    <th key={h} className="px-4 py-3.5 text-left text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {margins?.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3.5 text-slate-800 font-semibold max-w-[160px] truncate">{p.name}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap"><Badge color="indigo">{p.category}</Badge></td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium whitespace-nowrap">{fmt(p.price)}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                      {p.purchasePrice ? fmt(p.purchasePrice) : <span className="text-amber-400 text-xs font-medium">Non défini</span>}
                    </td>
                    <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-500' : 'text-slate-700'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{fmt(p.stockValue)}</td>
                    <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">{p.totalSold}</td>
                    <td className="px-4 py-3.5 text-slate-700 font-medium whitespace-nowrap">{fmt(p.totalRevenue)}</td>
                    <td className={`px-4 py-3.5 font-bold whitespace-nowrap ${p.grossProfit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {fmt(p.grossProfit)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {p.margin !== null ? (
                        <span className={`text-sm font-extrabold ${p.margin >= 30 ? 'text-emerald-600' : p.margin >= 10 ? 'text-amber-500' : 'text-red-500'}`}>
                          {p.margin}%
                        </span>
                      ) : <span className="text-slate-200 text-xs">—</span>}
                    </td>
                  </tr>
                ))}
                {!margins?.length && (
                  <tr><td colSpan={10} className="px-4 py-16 text-center text-slate-400">Aucun produit</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB: FOURNISSEURS
      ══════════════════════════════════════════ */}
      {tab === 'suppliers' && (
        <div>
          <SectionHeader title={`Fournisseurs (${allSuppliers?.length ?? 0})`} />

          {suppliersLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {allSuppliers?.map((s) => (
                <div key={s.id}
                  className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${s.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                        {s.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{s.name}</p>
                        {s.address && <p className="text-xs text-slate-400 mt-0.5">{s.address}</p>}
                      </div>
                    </div>
                    <Badge color={s.isActive ? 'green' : 'slate'}>
                      {s.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 mb-4 text-sm">
                    {s.email && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-slate-300">✉</span>
                        <a href={`mailto:${s.email}`} className="hover:text-indigo-600 transition-colors truncate">{s.email}</a>
                      </div>
                    )}
                    {s.phone && (
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="text-slate-300">📞</span>
                        <span>{s.phone}</span>
                      </div>
                    )}
                    {!s.email && !s.phone && (
                      <p className="text-xs text-slate-300 italic">Aucune coordonnée renseignée</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-slate-800">{s._count?.stockEntries ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-0.5">entrées stock</p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className="text-2xl font-bold text-slate-800">{s._count?.expenses ?? 0}</p>
                      <p className="text-xs text-slate-400 mt-0.5">dépenses liées</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingSupplier(s); setShowSupplierModal(true); }}
                      className="flex-1 text-xs font-semibold py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => toggleSupplierMutation.mutate(s.id)}
                      disabled={toggleSupplierMutation.isPending}
                      className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition-colors disabled:opacity-50 ${
                        s.isActive
                          ? 'border-red-200 text-red-500 hover:bg-red-50'
                          : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                      }`}>
                      {s.isActive ? '⏸ Désactiver' : '▶ Activer'}
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => { setEditingSupplier(null); setShowSupplierModal(true); }}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-all min-h-[200px]">
                <span className="text-3xl">+</span>
                <span className="text-sm font-semibold">Nouveau fournisseur</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          MODAL: Dépense
      ══════════════════════════════════════════ */}
      <Modal open={showExpenseModal} onClose={() => setShowExpenseModal(false)} title="Enregistrer une dépense">
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Catégorie *</label>
            <select name="category" required className={inputCls}>
              <option value="">Sélectionner…</option>
              {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Libellé *</label>
            <input name="label" required placeholder="Ex: Achat crèmes L'Oréal" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Montant (FCFA) *</label>
              <input name="amount" type="number" min="0" step="1" required placeholder="0" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Date *</label>
              <input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fournisseur</label>
              <select name="supplierId" className={inputCls}>
                <option value="">Aucun</option>
                {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>N° facture</label>
              <input name="reference" placeholder="FAC-001" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Notes</label>
            <textarea name="notes" rows={2} className={`${inputCls} resize-none`} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setShowExpenseModal(false)}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={createExpenseMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
              {createExpenseMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: Mouvement de stock
      ══════════════════════════════════════════ */}
      <Modal open={showStockModal} onClose={() => { setShowStockModal(false); setStockMovementType('IN'); }} title="Enregistrer un mouvement de stock">
        <form onSubmit={handleStockSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Produit *</label>
            <select name="productId" required className={inputCls}>
              <option value="">Sélectionner un produit…</option>
              {Array.isArray(products) && products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.stock !== undefined ? `— stock: ${p.stock}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Type de mouvement *</label>
              <select name="type" required className={inputCls}
                value={stockMovementType}
                onChange={(e) => setStockMovementType(e.target.value)}>
                {MOVEMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Quantité *</label>
              <input name="quantity" type="number" min="1" required className={inputCls} />
            </div>
          </div>

          {IS_INCOMING(stockMovementType) && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Prix d'achat unitaire (FCFA)</label>
                <input name="unitCost" type="number" min="0" step="1" placeholder="0" className={inputCls} />
                <p className="text-xs text-slate-400 mt-1">Met à jour le prix d'achat du produit</p>
              </div>
              <div>
                <label className={labelCls}>Fournisseur</label>
                <select name="supplierId" className={inputCls}>
                  <option value="">Aucun</option>
                  {suppliers?.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>N° facture / référence</label>
              <input name="reference" placeholder="FAC-001" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Motif</label>
              <input name="reason" placeholder="Ex: Réapprovisionnement mensuel" className={inputCls} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowStockModal(false); setStockMovementType('IN'); }}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={createStockMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
              {createStockMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════
          MODAL: Fournisseur (création + édition)
      ══════════════════════════════════════════ */}
      <Modal
        open={showSupplierModal}
        onClose={() => { setShowSupplierModal(false); setEditingSupplier(null); }}
        title={editingSupplier ? `Modifier — ${editingSupplier.name}` : 'Nouveau fournisseur'}>
        <form onSubmit={handleSupplierSubmit} className="space-y-4">
          <div>
            <label className={labelCls}>Nom *</label>
            <input name="name" required placeholder="Nom de l'entreprise" defaultValue={editingSupplier?.name ?? ''} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Email</label>
              <input name="email" type="email" placeholder="contact@fournisseur.com" defaultValue={editingSupplier?.email ?? ''} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Téléphone</label>
              <input name="phone" placeholder="+221 77 xxx xx xx" defaultValue={editingSupplier?.phone ?? ''} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Adresse</label>
            <input name="address" placeholder="Quartier, Ville" defaultValue={editingSupplier?.address ?? ''} className={inputCls} />
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => { setShowSupplierModal(false); setEditingSupplier(null); }}
              className="flex-1 border border-slate-200 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors disabled:opacity-50">
              {(createSupplierMutation.isPending || updateSupplierMutation.isPending)
                ? 'Enregistrement…'
                : editingSupplier ? 'Mettre à jour' : 'Ajouter'}
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
