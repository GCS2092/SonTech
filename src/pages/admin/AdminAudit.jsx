import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, Search, RefreshCw } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import Pagination from '../../components/shared/Pagination';
import DateRangeFilter from '../../components/admin/DateRangeFilter';

const formatDate = (iso) =>
  new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const ACTION_LABELS = {
  ORDER_CREATE: 'Création commande',
  ORDER_STATUS_UPDATE: 'Changement statut',
  PAYMENT_STATUS_UPDATE: 'Validation paiement',
};

export default function AdminAudit() {
  const [search, setSearch] = useState('');
  const [module, setModule] = useState('');
  const [page, setPage] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['admin-audit', page, search, module, from, to],
    queryFn: () =>
      adminApi
        .getAuditLogs({
          page,
          limit: 30,
          ...(search.trim() && { search: search.trim() }),
          ...(module && { module }),
          ...(from && { from }),
          ...(to && { to }),
        })
        .then((r) => r.data),
  });

  const logs = data?.data || [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 pl-12 lg:pl-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} className="text-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Sécurité</span>
          </div>
          <h1 className="text-2xl font-bold text-stone-900">Journal d&apos;audit</h1>
          <p className="text-stone-500 text-sm mt-1">Traçabilité des actions sensibles</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 border border-stone-200 bg-white px-4 py-2 rounded-xl text-sm"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Action, module, ID entité…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-stone-200 text-sm"
            />
          </div>
          <select
            value={module}
            onChange={(e) => { setModule(e.target.value); setPage(1); }}
            className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm"
          >
            <option value="">Tous les modules</option>
            <option value="orders">Commandes</option>
          </select>
        </div>
        <DateRangeFilter
          from={from}
          to={to}
          onFromChange={(v) => { setFrom(v); setPage(1); }}
          onToChange={(v) => { setTo(v); setPage(1); }}
        />
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-stone-400">Chargement…</div>
        ) : logs.length === 0 ? (
          <div className="py-20 text-center text-stone-400">Aucune entrée</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Module</th>
                  <th className="px-5 py-3">Entité</th>
                  <th className="px-5 py-3">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50 align-top">
                    <td className="px-5 py-3 text-stone-600 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="px-5 py-3 font-medium">{ACTION_LABELS[log.action] || log.action}</td>
                    <td className="px-5 py-3">{log.module}</td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">
                      {log.entityType && `${log.entityType} `}
                      {log.entityId ? log.entityId.slice(0, 12) + '…' : '—'}
                    </td>
                    <td className="px-5 py-3 text-xs text-stone-500 max-w-xs">
                      {log.newValue && (
                        <pre className="whitespace-pre-wrap break-all bg-stone-50 rounded p-2">
                          {JSON.stringify(log.newValue, null, 0)}
                        </pre>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
