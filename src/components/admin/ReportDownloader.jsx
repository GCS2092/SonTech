import { useState } from 'react';
import { Download, Mail, FileText } from 'lucide-react';
import { adminApi } from '../../api/admin.api';
import { API_URL } from '../../utils/constants';
import useAuthStore from '../../store/authStore';
import { toast } from 'sonner';

export default function ReportDownloader({ storeId }) {
  const { token } = useAuthStore();
  const today = new Date().toISOString().slice(0, 10);
  const firstOfMonth = today.slice(0, 8) + '01';

  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);

  const params = new URLSearchParams({ storeId, from, to }).toString();

  const handleDownload = async () => {
    if (!storeId) return toast.error('Sélectionnez une boutique');
    setLoadingPdf(true);
    try {
      const res = await fetch(
        `${API_URL}/api/admin/reports/download?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${from}-${to}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Rapport téléchargé');
    } catch {
      toast.error('Erreur lors de la génération du rapport');
    } finally {
      setLoadingPdf(false);
    }
  };

  const handleEmail = async () => {
    if (!storeId) return toast.error('Sélectionnez une boutique');
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
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Du</label>
          <input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-semibold uppercase tracking-widest text-stone-400">Au</label>
          <input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
            className="text-sm px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 focus:outline-none focus:ring-2 focus:ring-rose-300"
          />
        </div>

        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleDownload}
            disabled={loadingPdf}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-60 text-white text-sm font-medium transition-colors"
          >
            <Download size={14} />
            {loadingPdf ? 'Génération…' : 'Télécharger PDF'}
          </button>
          <button
            onClick={handleEmail}
            disabled={loadingEmail}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 disabled:opacity-60 text-stone-700 text-sm font-medium transition-colors"
          >
            <Mail size={14} />
            {loadingEmail ? 'Envoi…' : 'Envoyer par email'}
          </button>
        </div>
      </div>
    </div>
  );
}