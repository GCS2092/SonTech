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

const LAST_ORDER_KEY = 'urbanbeauty_last_order_number';

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

  const initialOrderNumber =
    paramOrderNumber || localStorage.getItem(LAST_ORDER_KEY) || '';

  const [search, setSearch] = useState(initialOrderNumber);
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

  useEffect(() => {
    if (order?.orderNumber) {
      localStorage.setItem(LAST_ORDER_KEY, order.orderNumber);
    }
  }, [order]);

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
          from { opacity: 0; transform: translateX(-12px) scale(0.8); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fade-up 0.4s ease-out both; }
      `}</style>

      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-stone-400 hover:text-rose-500 mb-6 transition-colors focus-visible:outline-2 focus-visible:outline-rose-400 rounded"
      >
        <ChevronLeft size={16} /> Retour à l'accueil
      </Link>

      <div className="text-center mb-8 fade-up">
        <span className="inline-block text-[11px] font-semibold uppercase tracking-widest text-rose-400 bg-rose-50 px-3 py-1 rounded-full mb-3">
          Suivi de commande
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 mb-2 tracking-tight">
          Où est mon colis ?
        </h1>
        <p className="text-stone-400 text-sm">
          Entrez votre numéro de commande pour suivre son trajet 📦
        </p>
      </div>

      {/* Barre de recherche */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col xs:flex-row gap-2 mb-8 fade-up"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex-1">
          <Input
            placeholder="Ex : UB-2024-001"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button type="submit" loading={isFetching} className="shrink-0 w-full xs:w-auto">
          <Search size={16} /> Rechercher
        </Button>
      </form>

      {!activeSearch && (
        <div className="text-center text-stone-400 text-sm py-16 fade-up">
          Le numéro de commande se trouve dans votre email ou message WhatsApp de confirmation.
        </div>
      )}

      {activeSearch && isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )}

      {activeSearch && !isLoading && (isError || !order) && (
        <div className="text-center py-16 space-y-3 fade-up">
          <p className="text-4xl">🔍</p>
          <p className="text-stone-600 font-medium">Commande introuvable</p>
          <p className="text-stone-400 text-sm">
            Vérifiez le numéro saisi ou contactez-nous si le problème persiste.
          </p>
        </div>
      )}

      {order && (
        <div className="space-y-4">

          {/* ── Hero statut ── */}
          <div
            className={`fade-up rounded-3xl p-7 sm:p-8 text-center border shadow-sm ${
              isCancelled
                ? 'bg-red-50 border-red-100'
                : 'bg-gradient-to-br from-rose-50 via-white to-amber-50 border-rose-100'
            }`}
          >
            <div className="relative inline-block mb-3">
              {!isCancelled && (
                <span className="absolute inset-0 -m-2 rounded-full bg-rose-200/40 blur-xl" />
              )}
              <div
                className="relative text-6xl inline-block"
                style={{ animation: isCancelled ? 'none' : 'bounce-soft 2s ease-in-out infinite' }}
              >
                {hero.emoji}
              </div>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-800">{hero.title}</h2>
            <p className="text-stone-500 text-sm mt-1 max-w-sm mx-auto">{hero.desc}</p>
            <div className="inline-flex items-center gap-2 text-xs text-stone-400 mt-4 bg-white/70 border border-stone-100 rounded-full px-3 py-1.5">
              <span className="font-semibold text-stone-600">#{order.orderNumber}</span>
              <span className="w-1 h-1 rounded-full bg-stone-300" />
              {formatDateTime(order.createdAt)}
            </div>
          </div>

          {/* ── La route (frise de progression) ── */}
          {!isCancelled && !isDraft && (
            <div className="fade-up bg-white rounded-3xl border border-stone-100 shadow-sm p-5 sm:p-7">
              <h3 className="text-sm font-semibold text-stone-700 mb-6">Le trajet de votre colis</h3>
              <div className="relative pt-2 pb-1">
                {/* Route pointillée */}
                <div
                  className="absolute top-[19px] sm:top-[23px] left-0 right-0 h-0.5 border-t-2 border-dashed border-stone-200"
                  aria-hidden="true"
                />
                {/* Route parcourue */}
                <div
                  className="absolute top-[19px] sm:top-[23px] left-0 h-0.5 border-t-2 border-rose-400 transition-all duration-700"
                  style={{ width: `${progressPercent}%` }}
                  aria-hidden="true"
                />
                {/* Voiture */}
                <div
                  className="absolute top-0 sm:top-[-2px] text-xl sm:text-2xl transition-all duration-700 drop-shadow"
                  style={{
                    left: `calc(${progressPercent}% - ${progressPercent === 0 ? '0px' : '14px'})`,
                    animation: 'drive-in 0.6s ease-out',
                  }}
                  aria-hidden="true"
                >
                  🚗
                </div>

                {/* Étapes */}
                <div className="relative flex justify-between">
                  {STEPS.map((step) => {
                    const stepIdx = STEPS.findIndex((s) => s.key === step.key);
                    const done = stepIdx <= currentStepIndex;
                    return (
                      <div key={step.key} className="flex flex-col items-center gap-1.5 w-8 sm:w-16">
                        <div
                          className={`w-3.5 h-3.5 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-sm border-2 transition-colors ${
                            done
                              ? 'bg-rose-500 border-rose-500 text-white'
                              : 'bg-white border-stone-200 text-stone-300'
                          }`}
                        >
                          <span className="hidden sm:inline">{step.emoji}</span>
                        </div>
                        <span
                          className={`hidden sm:block text-[10px] text-center font-medium leading-tight ${
                            done ? 'text-rose-500' : 'text-stone-400'
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
            <div className="fade-up bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-2.5">
              <MessageCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700">
                Cette commande est en attente de confirmation. Assurez-vous d'avoir bien
                envoyé le message WhatsApp pour la valider.
              </p>
            </div>
          )}

          {/* ── Historique détaillé ── */}
          {order.tracking?.length > 0 && (
            <div className="fade-up bg-white rounded-3xl border border-stone-100 shadow-sm p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-stone-700 mb-4">Historique</h3>
              <div className="space-y-1">
                {[...order.tracking].reverse().map((track, i, arr) => {
                  const stepInfo = STEPS.find((s) => s.key === track.status);
                  return (
                    <div key={track.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${
                            i === 0 ? 'bg-rose-500 text-white' : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {stepInfo?.emoji || (track.status === 'CANCELLED' ? '❌' : '•')}
                        </div>
                        {i < arr.length - 1 && <div className="w-px flex-1 min-h-[16px] bg-stone-100 my-1" />}
                      </div>
                      <div className="pb-4 min-w-0">
                        <p className="text-sm font-semibold text-stone-800">
                          {stepInfo?.label || track.status}
                        </p>
                        {track.message && (
                          <p className="text-xs text-stone-400 mt-0.5 break-words">{track.message}</p>
                        )}
                        <p className="text-xs text-stone-300 mt-0.5">
                          {formatDateTime(track.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Articles ── */}
          <div className="fade-up bg-white rounded-3xl border border-stone-100 shadow-sm p-5 sm:p-6">
            <h3 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-1.5">
              <Package size={15} className="text-rose-400" /> Articles
            </h3>
            <div className="space-y-1">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center gap-3 py-2.5 border-b border-stone-50 last:border-0 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800 truncate">{item.productName}</p>
                    {item.variantLabel && <p className="text-xs text-stone-400">{item.variantLabel}</p>}
                    <p className="text-xs text-stone-400">x{item.quantity}</p>
                  </div>
                  <span className="font-semibold text-stone-800 shrink-0">
                    {formatPrice(item.subtotal)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-stone-900 pt-3 mt-2 border-t border-stone-100 text-sm">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>

          {/* ── Adresse & Paiement ── */}
          <div className="fade-up grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5 mb-2">
                <MapPin size={14} className="text-rose-400" /> Livraison
              </h3>
              <p className="text-sm text-stone-500">
                {order.shippingAddress?.city}, {order.shippingAddress?.country}
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-stone-700 flex items-center gap-1.5 mb-2">
                <CreditCard size={14} className="text-rose-400" /> Paiement
              </h3>
              <p className="text-sm text-stone-500">
                {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1.5 text-xs text-stone-400 py-2 fade-up">
            <ShieldCheck size={12} /> Suivi sécurisé
          </div>

          <button
            type="button"
            onClick={() => { setActiveSearch(null); setSearch(''); navigate('/suivi'); }}
            className="w-full text-center text-sm text-rose-500 hover:text-rose-600 font-medium py-2 focus-visible:outline-2 focus-visible:outline-rose-400 rounded fade-up"
          >
            Suivre une autre commande
          </button>
        </div>
      )}
    </div>
  );
}