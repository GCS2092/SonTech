import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, MapPin, CreditCard, Truck, Gift, AlertCircle, Copy, CheckCircle2, ShieldCheck, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { addressesApi } from '../../api/addresses.api';
import { couponsApi } from '../../api/coupons.api';
import { ordersApi } from '../../api/orders.api';
import { settingsApi } from '../../api/settings.api';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { formatPrice } from '../../utils/formatPrice';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import PaymentModal from '../../components/checkout/PaymentModal';
import { toast } from 'sonner';

// ✅ STORE ID sonTech — hardcodé en fallback si la variable d'env n'est pas définie
const STORE_ID = import.meta.env.VITE_STORE_ID || '1d791ecc-7f71-4fa8-bcc9-9e62cbe700e9';

// --- Destinations ---
const DESTINATIONS = [
  {
    value: 'SENEGAL',
    label: 'Sénégal (Dakar)',
    description: 'Frais communiqués via WhatsApp',
    shippingFixed: null,
    flag: '🇸🇳',
    isLocal: true,
  },
  {
    value: 'CONGO_EXPRESS',
    label: 'Congo — Express',
    description: 'Livraison rapide, délai réduit',
    flag: '🇨🇬',
    isLocal: false,
  },
  {
    value: 'CONGO_GROUPAGE',
    label: 'Congo — Groupage',
    description: 'Livraison groupée + cadeau offert',
    flag: '🇨🇬',
    hasGift: true,
    isLocal: false,
  },
];

function getAvailablePaymentMethods(destination) {
  const dest = DESTINATIONS.find((d) => d.value === destination);
  if (dest?.isLocal) return ['CASH_ON_DELIVERY', 'MOBILE_MONEY'];
  return ['MOBILE_MONEY'];
}

const PAYMENT_METHOD_INFO = {
  CASH_ON_DELIVERY: {
    label: 'Paiement à la livraison',
    description: 'Payez en espèces à la réception',
    icon: '💵',
  },
  MOBILE_MONEY: {
    label: 'Mobile Money',
    description: 'Wave · Orange Money · Free Money',
    icon: '📱',
  },
};

// --- Mobile Money Numbers ---
function MobileMoneyNumbers({ settings }) {
  const [copied, setCopied] = useState(null);

  const numbers = [
    { key: 'wave_number', label: 'Wave', accent: 'border-blue-500/30 bg-blue-950/40 text-blue-300' },
    { key: 'orange_money_number', label: 'Orange Money', accent: 'border-orange-500/30 bg-orange-950/40 text-orange-300' },
    { key: 'free_money_number', label: 'Free Money', accent: 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300' },
  ].filter((n) => settings?.[n.key]);

  if (!numbers.length) return null;

  const handleCopy = (number, label) => {
    navigator.clipboard.writeText(number);
    setCopied(label);
    toast.success(`Numéro ${label} copié !`);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Envoyer le paiement à :</p>
      {numbers.map(({ key, label, accent }) => (
        <div key={key} className={`flex items-center justify-between p-2.5 rounded-lg border ${accent}`}>
          <div>
            <p className="text-xs font-medium opacity-60">{label}</p>
            <p className="font-mono font-semibold text-sm tracking-widest">{settings[key]}</p>
          </div>
          <button
            type="button"
            onClick={() => handleCopy(settings[key], label)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-white/5 hover:bg-white/10 transition-colors text-xs font-medium"
          >
            {copied === label ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            {copied === label ? 'Copié' : 'Copier'}
          </button>
        </div>
      ))}
      {settings?.payment_instructions && (
        <p className="text-xs text-amber-400 bg-amber-950/30 border border-amber-500/20 rounded-lg p-2.5 leading-relaxed">
          {settings.payment_instructions}
        </p>
      )}
    </div>
  );
}

// --- WhatsApp message builder ---
const buildWhatsAppMessage = ({ cart, formData, subtotal, shippingCost, discount, total, coupon, orderNumber, destination, settings }) => {
  const lines = [];
  const dest = DESTINATIONS.find((d) => d.value === destination);

  lines.push(`*Nouvelle commande SonTech*`);
  lines.push(`Ref: *${orderNumber}*`);
  lines.push('');
  lines.push('*Articles :*');

  cart.items.forEach((item) => {
    const variantLabel = item.variant ? ` (${item.variant.size} - ${item.variant.color})` : '';
    lines.push(`- ${item.product.name}${variantLabel} x${item.quantity} -- ${formatPrice(item.product.price * item.quantity)}`);
  });

  lines.push('');
  lines.push('*Récapitulatif :*');
  lines.push(`Sous-total : ${formatPrice(subtotal)}`);

  if (destination === 'SENEGAL') {
    lines.push(`Livraison Sénégal : à confirmer`);
  } else {
    lines.push(`Livraison (${dest?.label}) : ${formatPrice(shippingCost)}`);
  }

  if (discount > 0) {
    lines.push(`Réduction${coupon ? ` (${coupon.code})` : ''} : -${formatPrice(discount)}`);
  }

  if (destination === 'SENEGAL') {
    lines.push(`*Total (hors livraison) : ${formatPrice(total - shippingCost)}*`);
  } else {
    lines.push(`*Total : ${formatPrice(total)}*`);
  }

  if (destination === 'CONGO_GROUPAGE') {
    const gift = settings?.congo_groupage_gift || 'un cadeau surprise';
    lines.push('');
    lines.push(`🎁 *Cadeau offert :* ${gift}`);
  }

  lines.push('');
  lines.push('*Livraison :*');
  lines.push(`Destination : ${dest?.label || destination}`);
  lines.push(`Nom : ${formData.fullName}`);
  lines.push(`Tél : ${formData.phone}`);
  lines.push(`Adresse : ${formData.street}, ${formData.city}`);
  lines.push('');
  lines.push(`Paiement : ${formData.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'À la livraison'}`);

  if (formData.notes) {
    lines.push('');
    lines.push(`Notes : ${formData.notes}`);
  }

  return encodeURIComponent(lines.join('\n'));
};

// --- Schema ---
const schema = z.object({
  fullName: z.string().min(2, 'Nom requis'),
  phone: z.string().min(6, 'Téléphone requis'),
  street: z.string().min(3, 'Adresse requise'),
  city: z.string().min(2, 'Ville requise'),
  destination: z.enum(['SENEGAL', 'CONGO_EXPRESS', 'CONGO_GROUPAGE']),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'MOBILE_MONEY']),
  notes: z.string().optional(),
  guestEmail: z.string().email('Email invalide').optional().or(z.literal('')),
});

// --- Shared card style ---
const card = "bg-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-4";
const sectionTitle = "font-semibold text-slate-100 flex items-center gap-2 text-sm uppercase tracking-wider";

// --- Main Component ---
export default function Checkout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { cart, getTotalPrice, clearCart } = useCartStore();

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);
  const [whatsappSent, setWhatsappSent] = useState(false);

  const { data: addresses } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => addressesApi.getAll().then((r) => r.data),
    enabled: !!user,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.getPublic().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      paymentMethod: 'CASH_ON_DELIVERY',
      destination: 'SENEGAL',
    },
  });

  const paymentMethod = watch('paymentMethod');
  const destination = watch('destination');

  const handleDestinationChange = (value) => {
    setValue('destination', value);
    const availableMethods = getAvailablePaymentMethods(value);
    if (!availableMethods.includes(paymentMethod)) {
      setValue('paymentMethod', 'MOBILE_MONEY');
    }
  };

  const availablePaymentMethods = getAvailablePaymentMethods(destination);
  const isInternational = !DESTINATIONS.find((d) => d.value === destination)?.isLocal;

  const getShippingCost = () => {
    if (destination === 'SENEGAL') return 0;
    if (destination === 'CONGO_EXPRESS') return Number(settings?.congo_express_rate || 15000);
    if (destination === 'CONGO_GROUPAGE') return Number(settings?.congo_groupage_rate || 8000);
    return 0;
  };

  const shippingCost = getShippingCost();
  const selectedDest = DESTINATIONS.find((d) => d.value === destination);
  const subtotal = getTotalPrice();
  const discount = coupon
    ? coupon.type === 'PERCENTAGE'
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value
    : 0;
  const total = subtotal + shippingCost - discount;

  const depositThreshold = Number(settings?.deposit_threshold || 0);
  const depositPercent = Number(settings?.deposit_percent || 30);
  const requiresDeposit =
    destination === 'SENEGAL' &&
    paymentMethod === 'CASH_ON_DELIVERY' &&
    depositThreshold > 0 &&
    subtotal >= depositThreshold;
  const depositAmount = requiresDeposit ? Math.ceil((subtotal * depositPercent) / 100) : 0;

  const fillFromAddress = (addr) => {
    setValue('fullName', addr.fullName);
    setValue('phone', addr.phone);
    setValue('street', addr.street);
    setValue('city', addr.city);
  };

  // ✅ storeId correctement inclus dans le payload
  const buildOrderPayload = (formData) => ({
    storeId: STORE_ID,
    items: cart.items.map((item) => ({
      productId: item.product.id,
      variantId: item.variant?.id || null,
      productName: item.product.name,
      variantLabel: item.variant ? `${item.variant.size} - ${item.variant.color}` : null,
      price: item.product.price,
      quantity: item.quantity,
    })),
    paymentMethod: formData.paymentMethod,
    shippingAddress: {
      fullName: formData.fullName,
      phone: formData.phone,
      street: formData.street,
      city: formData.city,
      country: selectedDest?.label || formData.destination,
    },
    shippingCost,
    notes: formData.notes,
    couponId: coupon?.id || null,
    guestEmail: !user ? formData.guestEmail : undefined,
    guestName: !user ? formData.fullName : undefined,
    guestPhone: formData.phone,
    destination: formData.destination,
  });

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    try {
      const { data } = await couponsApi.validate(couponCode, subtotal, STORE_ID);
      setCoupon(data.coupon);
      toast.success(
        `Coupon appliqué : -${data.coupon.type === 'PERCENTAGE' ? data.coupon.value + '%' : formatPrice(data.discount)}`
      );
    } catch (err) {
      toast.error(err.message || 'Coupon invalide');
      setCoupon(null);
    } finally {
      setValidatingCoupon(false);
    }
  };

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: (data) => ordersApi.create(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      clearCart(user?.id);
      setShowPaymentModal(false);
      toast.success('Commande passée avec succès !');

      if (user && !user.phone) {
        setTimeout(() => {
          toast.info('💡 Enregistrez votre numéro dans vos paramètres pour commander plus vite !', {
            duration: 6000,
            action: {
              label: 'Mes paramètres',
              onClick: () => navigate('/account/settings'),
            },
          });
        }, 1500);
      }

      navigate(`/orders/${res.data.orderNumber}`);
    },
    onError: (err) => {
      toast.error(err.message || 'Erreur lors de la commande');
    },
  });

  const { mutate: placeDraftOrder, isPending: isDraftPending } = useMutation({
    mutationFn: (data) => ordersApi.create({ ...data, status: 'DRAFT' }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      clearCart(user?.id);
      const orderNumber = res.data.orderNumber;
      const whatsappNumber = (settings?.whatsapp_number || '').replace(/\D/g, '');
      const message = buildWhatsAppMessage({
        cart,
        formData: variables._formData,
        subtotal,
        shippingCost,
        discount,
        total,
        coupon,
        orderNumber,
        destination,
        settings,
      });
      window.open(`https://wa.me/${whatsappNumber}?text=${message}`, '_blank');
      setWhatsappSent(true);
      toast.success('Commande enregistrée ! Envoyez le message WhatsApp pour confirmer.');
    },
    onError: (err) => {
      toast.error(err.message || 'Erreur lors de la création de la commande');
    },
  });

  const onSubmit = (formData) => {
    if (!cart?.items?.length) return toast.error('Votre panier est vide');
    if (formData.paymentMethod === 'MOBILE_MONEY') {
      setPendingOrderData(buildOrderPayload(formData));
      setShowPaymentModal(true);
      return;
    }
    placeOrder(buildOrderPayload(formData));
  };

  const onWhatsAppInfo = (formData) => {
    if (!cart?.items?.length) return toast.error('Votre panier est vide');
    const whatsappNumber = (settings?.whatsapp_number || '').replace(/\D/g, '');
    if (!whatsappNumber) { toast.error('Numéro WhatsApp non configuré.'); return; }
    const dest = DESTINATIONS.find((d) => d.value === formData.destination);
    const lines = [
      "Bonjour, j'aimerais avoir des informations sur les produits suivants :",
      '',
      ...cart.items.map((item) => {
        const v = item.variant ? ` (${item.variant.size} - ${item.variant.color})` : '';
        return `- ${item.product.name}${v} x${item.quantity}`;
      }),
      '',
      `Destination souhaitée : ${dest?.label || formData.destination}`,
      `Total estimé (sans livraison) : ${formatPrice(subtotal)}`,
    ];
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const onWhatsAppOrder = (formData) => {
    if (!cart?.items?.length) return toast.error('Votre panier est vide');
    const whatsappNumber = (settings?.whatsapp_number || '').replace(/\D/g, '');
    if (!whatsappNumber) { toast.error('Numéro WhatsApp non configuré.'); return; }
    const payload = buildOrderPayload(formData);
    placeDraftOrder({ ...payload, _formData: formData });
  };

  const handleConfirmPayment = () => {
    if (pendingOrderData) placeOrder(pendingOrderData);
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handleConfirmPayment}
        total={total}
        settings={settings}
        isPending={isPending}
        orderData={pendingOrderData}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 mb-8 transition-colors group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour au panier
        </Link>

        {/* Progress bar */}
        <div className="flex items-center gap-2 mb-10">
          {[
            { n: 1, label: 'Panier', done: true },
            { n: 2, label: 'Livraison & paiement', active: true },
            { n: 3, label: 'Confirmation', done: false },
          ].map((step, i) => (
            <div key={step.n} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors
                ${step.active ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' :
                  step.done ? 'bg-blue-600 text-white' :
                  'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                {step.n}
              </div>
              <span className={`text-sm font-medium hidden sm:block
                ${step.active ? 'text-blue-400' : step.done ? 'text-slate-400' : 'text-slate-600'}`}>
                {step.label}
              </span>
              {i < 2 && <div className={`h-px w-8 ml-1 ${step.done ? 'bg-blue-600/50' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-8">
          <Zap size={22} className="text-blue-500" />
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Finaliser la commande</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column — form */}
          <div className="lg:col-span-2 space-y-4">

            {/* Saved addresses */}
            {addresses?.length > 0 && (
              <div className={card}>
                <h2 className={sectionTitle}>
                  <MapPin size={15} className="text-blue-500" /> Mes adresses
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {addresses.map((addr) => (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => fillFromAddress(addr)}
                      className="text-left p-3 rounded-xl border border-slate-700 hover:border-blue-500/60 hover:bg-blue-950/20 transition-all"
                    >
                      <p className="font-medium text-slate-200 text-sm">{addr.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{addr.street}, {addr.city}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Guest email */}
            {!user && (
              <div className={card}>
                <h2 className={sectionTitle}>Email de confirmation</h2>
                <Input
                  label="Email (pour suivre votre commande)"
                  placeholder="votre@email.com"
                  error={errors.guestEmail?.message}
                  {...register('guestEmail')}
                />
                <p className="text-xs text-slate-500">
                  Retrouvez vos commandes en vous connectant avec cet email.
                </p>
              </div>
            )}

            {/* Destination */}
            <div className={card}>
              <h2 className={sectionTitle}>
                <Truck size={15} className="text-blue-500" /> Destination
              </h2>
              <div className="space-y-2">
                {DESTINATIONS.map((dest) => (
                  <label
                    key={dest.value}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      destination === dest.value
                        ? 'border-blue-500/70 bg-blue-950/30 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                        : 'border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      value={dest.value}
                      checked={destination === dest.value}
                      onChange={() => handleDestinationChange(dest.value)}
                      className="accent-blue-500 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base">{dest.flag}</span>
                        <span className="text-sm font-semibold text-slate-200">{dest.label}</span>
                        {dest.hasGift && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-900/40 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-medium">
                            <Gift size={10} /> Cadeau inclus
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{dest.description}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {dest.value === 'SENEGAL' ? (
                        <span className="text-xs text-slate-500 italic">Via WhatsApp</span>
                      ) : (
                        <span className="text-sm font-semibold text-blue-400">
                          {formatPrice(Number(settings?.[dest.value === 'CONGO_EXPRESS' ? 'congo_express_rate' : 'congo_groupage_rate'] || (dest.value === 'CONGO_EXPRESS' ? 15000 : 8000)))}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
              </div>

              {destination === 'CONGO_GROUPAGE' && (
                <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                  <Gift size={15} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400 leading-relaxed">
                    <strong>Cadeau offert !</strong> Un{' '}
                    {settings?.congo_groupage_gift || 'cadeau surprise'} sera glissé dans votre colis.
                  </p>
                </div>
              )}
            </div>

            {/* Shipping address */}
            <div className={card}>
              <h2 className={sectionTitle}>
                <MapPin size={15} className="text-blue-500" /> Adresse de livraison
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Nom complet"
                  placeholder="Marie Dupont"
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                <Input
                  label="Téléphone"
                  placeholder="+221 77 000 00 00"
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>
              <Input
                label="Adresse"
                placeholder="123 Rue de la Paix"
                error={errors.street?.message}
                {...register('street')}
              />
              <Input
                label="Ville"
                placeholder={destination === 'SENEGAL' ? 'Dakar' : 'Brazzaville'}
                error={errors.city?.message}
                {...register('city')}
              />
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                  Notes (optionnel)
                </label>
                <textarea
                  {...register('notes')}
                  rows={2}
                  placeholder="Instructions de livraison..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-200 text-base placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                />
              </div>
            </div>

            {/* Payment */}
            <div className={card}>
              <h2 className={sectionTitle}>
                <CreditCard size={15} className="text-blue-500" /> Mode de paiement
              </h2>

              {isInternational && (
                <div className="flex items-start gap-2.5 bg-blue-950/40 border border-blue-500/20 rounded-xl p-3">
                  <AlertCircle size={14} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-400 leading-relaxed">
                    Pour les commandes internationales, le <strong>paiement intégral est requis avant expédition</strong>.
                    Le paiement à la livraison n'est pas disponible.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                {availablePaymentMethods.map((method) => {
                  const info = PAYMENT_METHOD_INFO[method];
                  const isSelected = paymentMethod === method;
                  return (
                    <label
                      key={method}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500/70 bg-blue-950/30 shadow-[0_0_0_1px_rgba(59,130,246,0.15)]'
                          : 'border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method}
                        {...register('paymentMethod')}
                        className="accent-blue-500 mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{info.icon}</span>
                          <span className="text-sm font-medium text-slate-200">{info.label}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{info.description}</p>
                        {method === 'MOBILE_MONEY' && isSelected && isInternational && (
                          <MobileMoneyNumbers settings={settings} />
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              {requiresDeposit && (
                <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
                  <AlertCircle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-400 leading-relaxed space-y-1">
                    <p>
                      <strong>Acompte requis.</strong>{' '}
                      Un acompte de {depositPercent}% ({formatPrice(depositAmount)}) vous sera demandé avant l'expédition.
                    </p>
                    <p>Le solde ({formatPrice(subtotal - depositAmount)}) sera réglé à la livraison.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right column — order summary */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-4 lg:sticky lg:top-6">
              <h2 className="font-semibold text-slate-100 text-sm uppercase tracking-wider">Votre commande</h2>

              {/* Cart items */}
              <div className="space-y-3 max-h-52 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-slate-800 scrollbar-thumb-slate-600">
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="w-11 h-11 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      {item.product.images?.[0] ? (
                        <img
                          src={item.product.images.find((i) => i.isMain)?.url || item.product.images[0].url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs">?</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{item.product.name}</p>
                      <p className="text-xs text-slate-500">x{item.quantity}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-300 font-mono">
                      {formatPrice(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Coupon */}
              <div className="flex gap-2 pt-2 border-t border-slate-700/60">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Code promo"
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/50 text-slate-200 text-sm placeholder:text-slate-600 outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 font-mono transition-all"
                />
                <button
                  onClick={handleValidateCoupon}
                  disabled={validatingCoupon}
                  className="px-3 py-2 rounded-xl border border-slate-700 text-slate-300 hover:border-blue-500/50 hover:text-blue-400 text-xs font-medium transition-all disabled:opacity-50"
                >
                  {validatingCoupon ? '...' : 'Appliquer'}
                </button>
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-slate-700/60 pt-3">
                <div className="flex justify-between text-slate-400">
                  <span>Sous-total</span>
                  <span className="font-mono">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Livraison {selectedDest && `(${selectedDest.label})`}</span>
                  <span className="font-mono">
                    {destination === 'SENEGAL'
                      ? <span className="text-xs italic text-slate-500">Via WhatsApp</span>
                      : formatPrice(shippingCost)
                    }
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Réduction</span>
                    <span className="font-mono">-{formatPrice(discount)}</span>
                  </div>
                )}
                {destination === 'CONGO_GROUPAGE' && (
                  <div className="flex justify-between text-amber-400">
                    <span className="flex items-center gap-1"><Gift size={11} /> Cadeau offert</span>
                    <span className="text-xs font-medium">Inclus 🎁</span>
                  </div>
                )}
                {requiresDeposit && (
                  <div className="flex justify-between text-amber-400 text-xs">
                    <span>Acompte ({depositPercent}%)</span>
                    <span className="font-mono">{formatPrice(depositAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-100 pt-2 border-t border-slate-700/60 text-base">
                  <span>Total</span>
                  <span className="font-mono text-blue-400">
                    {destination === 'SENEGAL'
                      ? `${formatPrice(subtotal - discount)} + liv.`
                      : formatPrice(total)
                    }
                  </span>
                </div>
              </div>

              {/* Trust badges */}
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600 py-1 border-t border-slate-700/60 pt-3">
                <span className="flex items-center gap-1"><Lock size={10} /> Sécurisé</span>
                <span className="flex items-center gap-1"><ShieldCheck size={10} /> Protégé</span>
                <span className="flex items-center gap-1"><Truck size={10} /> Suivi</span>
              </div>

              {/* Primary CTA */}
              <button
                onClick={handleSubmit(onSubmit)}
                disabled={isPending}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-700/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending
                  ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Traitement...</span>
                  : paymentMethod === 'MOBILE_MONEY' ? 'Payer par Mobile Money' : 'Confirmer la commande'
                }
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-700/60" />
                <span className="text-xs text-slate-600">ou</span>
                <div className="flex-1 h-px bg-slate-700/60" />
              </div>

              {/* WhatsApp buttons */}
              {whatsappSent ? (
                <div className="w-full rounded-xl bg-emerald-950/40 border border-emerald-500/20 p-4 text-center space-y-1.5">
                  <p className="text-sm font-semibold text-emerald-400">Message WhatsApp ouvert !</p>
                  <p className="text-xs text-emerald-600">
                    Commande enregistrée en brouillon. Elle sera confirmée dès validation.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isDraftPending}
                    onClick={handleSubmit(onWhatsAppOrder)}
                    className="w-full flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-60 text-white font-semibold text-sm py-3.5 rounded-xl transition-colors shadow-lg shadow-[#25D366]/20"
                  >
                    {isDraftPending ? (
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    )}
                    Commander via WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit(onWhatsAppInfo)}
                    className="w-full flex items-center justify-center gap-2 border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/5 font-medium text-sm py-3 rounded-xl transition-colors"
                  >
                    Demander des infos via WhatsApp
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-600 text-center">
                Un message pré-rempli s'ouvrira dans WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}