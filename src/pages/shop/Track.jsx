import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, MapPin, CreditCard, Package, ChevronLeft,
  ShieldCheck, MessageCircle,
} from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { formatPrice } from '../../utils/formatPrice';
import { formatDateTime } from '../../utils/formatDate';
import { PAYMENT_METHOD_LABELS } from '../../utils/constants';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const STEPS = [
  { key: 'PENDING', label: 'En attente', short: 'Reçue', emoji: '🕐' },
  { key: 'CONFIRMED', label: 'Confirmée', short: 'Confirmée', emoji: '✅' },
  { key: 'PROCESSING', label: 'En préparation', short: 'Préparation', emoji: '📦' },
  { key: 'SHIPPED', label: 'En livraison', short: 'Livraison', emoji: '🚚' },
  { key: 'DELIVERED', label: 'Livrée', short: 'Livrée', emoji: '🎉' },
];

const HERO_TEXT = {
  DRAFT: { emoji: '📝', title: 'Commande en brouillon', desc: 'En attente de confirmation via WhatsApp.' },
  PENDING: { emoji: '🕐', title: 'Commande reçue', desc: 'Nous préparons la confirmation de votre commande.' },
  CONFIRMED: { emoji: '✅', title: 'Commande confirmée', desc: 'Votre commande a été validée, elle va être préparée.' },
  PROCESSING: { emoji: '📦', title: 'En préparation', desc: 'Vos articles sont en cours de préparation.' },
  SHIPPED: { emoji: '🚚', title: 'En cours de livraison', desc: 'Votre colis est en route !' },
  DELIVERED: { emoji: '🎉', title: 'Commande livrée', desc: 'Votre colis a été livré. Merci pour votre confiance !' },
  CANCELLED: { emoji: '❌', title: 'Commande annulée', desc: 'Cette commande a été annulée.' },
};

export default function Track() {
  const { orderNumber: paramOrderNumber } = useParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState(paramOrderNumber || '');
  const [activeSearch, setActiveSearch] = useState(paramOrderNumber || null);

  useEffect(() => {
    if (paramOrderNumber) {
      setSearch(paramOrderNumber);
      setActiveSearch(paramOrderNumber);
    }
  }, [paramOrderNumber]);

  const { data: order, isLoading, isError, isFetching } = useQuery({
    queryKey: ['track-order', activeSearch],
    queryFn: () => ordersApi.getByNumber(activeSearch).then((r) => r.data),
    enabled: !!activeSearch,
    retry: false,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = search.trim();
    if (!clean) return;
    setActiveSearch(clean);
    navigate(`/suivi/${clean}`, { replace: true });
  };

  const currentStepIndex = order
    ? STEPS.findIndex((s) => s.key === order.status)
    : -1;
  const isCancelled = order?.status === 'CANCELLED';
  const isDraft = order?.status === 'DRAFT';
  const hero = order ? HERO_TEXT[order.status] : null;
  const progressPercent =
    currentStepIndex >= 0 ? (currentStepIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <style>{`
        @keyframes bounce-soft {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-5px) rotate(-2deg); }
        }
        @keyframes drive-in {
          from { opacity: 0; transform: translateX(-12px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 mb-6 transition-colors"
      >
        <ChevronLeft size={16} /> Retour à l'accueil
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Suivre ma commande</h1>
        <p className="text-slate-400 text-sm">
          Entrez votre numéro de commande pour voir où en est votre colis 📦
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-8">
        <div className="flex-1">
          <Input
            placeholder="Ex : ST-2024-001"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isFetching} className="shrink-0">
          <Search size={16} /> Rechercher
        </Button>
      </form>

      {!activeSearch && (
        <div className="text-center text-slate-400 text-sm py-16">
          Le numéro de commande se trouve dans votre email ou message WhatsApp de confirmation.
        </div>
      )}

      {activeSearch && isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {activeSearch && !isLoading && (isError || !order) && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🔍</p>
          <p className="text-slate-600 font-medium">Commande introuvable</p>
          <p className="text-slate-400 text-sm">
            Vérifiez le numéro saisi ou contactez-nous si le problème persiste.
          </p>
        </div>
      )}

      {order && (
        <div className="space-y-5">

          {/* Hero statut */}
          <div
            className={`rounded-3xl p-8 text-center border ${
              isCancelled
                ? 'bg-red-50 border-red-100'
                : 'bg-gradient-to-br from-blue-50 via-white to-sky-50 border-blue-100'
            }`}
          >
            <div
              className="text-6xl mb-3 inline-block"
              style={{ animation: isCancelled ? 'none' : 'bounce-soft 2s ease-in-out infinite' }}
            >
              {hero.emoji}
            </div>
            <h2 className="text-xl font-bold text-slate-800">{hero.title}</h2>
            <p className="text-slate-500 text-sm mt-1">{hero.desc}</p>
            <p className="text-xs text-slate-400 mt-3">
              Commande <span className="font-semibold text-slate-600">#{order.orderNumber}</span>
              {' · '}
              {formatDateTime(order.createdAt)}
            </p>
          </div>

          {/* Frise de progression */}
          {!isCancelled && !isDraft && (
            <div className="bg-white rounded-2xl border border-blue-100 p-6 overflow-x-auto">
              <div className="relative min-w-[520px] sm:min-w-0 pt-6">
                <div className="absolute top-[38px] left-[5%] right-[5%] h-1.5 bg-stone-100 rounded-full" />
                <div
                  className="absolute top-[38px] left-[5%] h-1.5 bg-blue-600 rounded-full transition-all duration-700"
                  style={{ width: `${progressPercent * 0.9}%` }}
                />
                <div
                  className="absolute top-[14px] text-2xl transition-all duration-700"
                  style={{
                    left: `calc(5% + ${progressPercent * 0.9}% - 12px)`,
                    animation: 'drive-in 0.6s ease-out',
                  }}
                >
                  🚗
                </div>

                <div className="relative flex justify-between px-[5%]">
                  {STEPS.map((step, i) => {
                    const done = i <= currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-2 w-16">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-colors ${
                            done
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-stone-200 text-stone-300'
                          }`}
                        >
                          {step.emoji}
                        </div>
                        <span
                          className={`text-[11px] text-center font-medium leading-tight ${
                            done ? 'text-blue-600' : 'text-slate-400'
                          }`}
                        >
                          {step.short}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {isDraft && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5">
              <MessageCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                Cette commande est en attente de confirmation. Assurez-vous d'avoir bien
                envoyé le message WhatsApp pour la valider.
              </p>
            </div>
          )}

          {/* Historique détaillé */}
          {order.tracking?.length > 0 && (
            <div className="bg-white rounded-2xl border border-blue-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Historique</h3>
              <div className="space-y-1">
                {[...order.tracking].reverse().map((track, i, arr) => {
                  const stepInfo = STEPS.find((s) => s.key === track.status);
                  return (
                    <div key={track.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                            i === 0 ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {stepInfo?.emoji || (track.status === 'CANCELLED' ? '❌' : '•')}
                        </div>
                        {i < arr.length - 1 && <div className="w-px h-6 bg-stone-100 my-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {stepInfo?.label || track.status}
                        </p>
                        {track.message && (
                          <p className="text-xs text-slate-400 mt-0.5">{track.message}</p>
                        )}
                        <p className="text-xs text-slate-300 mt-0.5">
                          {formatDateTime(track.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Articles */}
          <div className="bg-white rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5">
              <Package size={15} className="text-blue-600" /> Articles
            </h3>
            <div className="space-y-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-stone-50 last:border-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-800 truncate">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-slate-400">{item.variantLabel}</p>}
                    <p className="text-xs text-slate-400">x{item.quantity}</p>
                  </div>
                  <span className="font-semibold text-slate-800 shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-3 mt-2 border-t border-stone-100 text-sm">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* Adresse & Paiement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-blue-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                <MapPin size={14} className="text-blue-600" /> Livraison
              </h3>
              <p className="text-sm text-slate-500">
                {order.shippingAddress?.city}, {order.shippingAddress?.country}
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100 p-5">
              <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5 mb-2">
                <CreditCard size={14} className="text-blue-600" /> Paiement
              </h3>
              <p className="text-sm text-slate-500">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-400 py-2">
            <span className="flex items-center gap-1"><ShieldCheck size={12} /> Suivi sécurisé</span>
          </div>

          <button
            type="button"
            onClick={() => { setActiveSearch(null); setSearch(''); navigate('/suivi'); }}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2"
          >
            Suivre une autre commande
          </button>
        </div>
      )}
    </div>
  );
}