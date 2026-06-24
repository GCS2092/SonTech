import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings, Smartphone, Truck, Save, CheckCircle,
  MessageCircle, Building2, ShieldAlert, Globe,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminApi } from '../../api/admin.api';

function SettingInput({ label, value, onChange, placeholder, hint, type = 'text' }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-rose-300 transition-shadow"
      />
      {hint && <p className="text-xs text-stone-400">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    // Entreprise
    company_name: '',
    company_address: '',
    company_phone: '',
    company_email: '',
    // Mobile Money
    wave_number: '',
    orange_money_number: '',
    free_money_number: '',
    payment_instructions: '',
    // WhatsApp
    whatsapp_number: '',
    // Livraison locale
    delivery_fee: '2000',
    free_delivery_threshold: '50000',
    // Livraison Congo
    congo_express_rate: '15000',
    congo_groupage_rate: '8000',
    congo_groupage_gift: 'un cadeau surprise',
    // Sénégal — acompte
    deposit_threshold: '0',
    deposit_percent: '30',
  });
  const [saved, setSaved] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => adminApi.getSettings().then((r) => r.data),
  });

  useEffect(() => {
    if (settings) setForm((prev) => ({ ...prev, ...settings }));
  }, [settings]);

  const { mutate: saveSettings, isPending } = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Paramètres sauvegardés !');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const update = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 p-4 sm:p-6 lg:p-8">

      {/* Header */}
      <div className="mb-8 pl-12 lg:pl-0">
        <div className="flex items-center gap-2 mb-1">
          <Settings size={16} className="text-rose-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-stone-400">Configuration</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">Paramètres</h1>
        <p className="text-stone-500 text-sm mt-1">
          Configurez les paiements, la livraison et les règles commerciales
        </p>
      </div>

      <div className="max-w-2xl space-y-5">

        {/* ── Entreprise ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <Building2 size={15} className="text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Entreprise (factures PDF)</h2>
              <p className="text-xs text-stone-400">Affiché en en-tête des factures</p>
            </div>
          </div>
          <SettingInput label="Nom de l'entreprise" value={form.company_name} onChange={update('company_name')} placeholder="SonShop" />
          <SettingInput label="Adresse" value={form.company_address} onChange={update('company_address')} placeholder="Dakar, Sénégal" />
          <SettingInput label="Téléphone" value={form.company_phone} onChange={update('company_phone')} placeholder="+221 77 000 00 00" />
          <SettingInput label="Email" value={form.company_email} onChange={update('company_email')} placeholder="sonshop221@gmail.com" />
        </div>

        {/* ── Mobile Money ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center">
              <Smartphone size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Numéros Mobile Money</h2>
              <p className="text-xs text-stone-400">
                Affichés aux clients Sénégal (via modal) et Congo (directement dans le checkout)
              </p>
            </div>
          </div>

          <SettingInput
            label="Numéro Wave"
            value={form.wave_number}
            onChange={update('wave_number')}
            placeholder="+221 77 123 45 67"
            hint="Laissez vide pour ne pas afficher ce mode"
          />
          <SettingInput
            label="Numéro Orange Money"
            value={form.orange_money_number}
            onChange={update('orange_money_number')}
            placeholder="+221 76 123 45 67"
          />
          <SettingInput
            label="Numéro Free Money"
            value={form.free_money_number}
            onChange={update('free_money_number')}
            placeholder="+221 78 123 45 67"
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Instructions de paiement</label>
            <textarea
              value={form.payment_instructions}
              onChange={(e) => update('payment_instructions')(e.target.value)}
              rows={3}
              placeholder="Envoyez le montant exact puis cliquez sur J'ai payé."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm outline-none focus:ring-2 focus:ring-rose-300 resize-none transition-shadow"
            />
            <p className="text-xs text-stone-400">
              Affiché dans la modal de paiement (Sénégal) et sous les numéros (Congo)
            </p>
          </div>
        </div>

        {/* ── WhatsApp ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-green-100 flex items-center justify-center">
              <MessageCircle size={15} className="text-green-600" />
            </div>
            <h2 className="font-semibold text-stone-900">WhatsApp Admin</h2>
          </div>
          <SettingInput
            label="Numéro WhatsApp (avec indicatif pays)"
            value={form.whatsapp_number}
            onChange={update('whatsapp_number')}
            placeholder="221771234567"
            hint="Sans espaces ni + (ex: 221771234567). Les clients seront redirigés ici."
          />
        </div>

        {/* ── Livraison Sénégal ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center">
              <Truck size={15} className="text-amber-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Livraison Sénégal</h2>
              <p className="text-xs text-stone-400">Frais appliqués aux commandes locales</p>
            </div>
          </div>
          <SettingInput
            label="Frais de livraison (FCFA)"
            value={form.delivery_fee}
            onChange={update('delivery_fee')}
            placeholder="2000"
            hint="Frais appliqués à chaque commande"
          />
          <SettingInput
            label="Seuil livraison gratuite (FCFA)"
            value={form.free_delivery_threshold}
            onChange={update('free_delivery_threshold')}
            placeholder="50000"
            hint="Livraison gratuite au-dessus de ce montant. Mettez 0 pour désactiver."
          />
        </div>

        {/* ── Règles acompte Sénégal ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
              <ShieldAlert size={15} className="text-rose-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Acompte — Sénégal (paiement à la livraison)</h2>
              <p className="text-xs text-stone-400">
                Pour les grosses commandes, demandez un acompte avant expédition
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-700 leading-relaxed">
              Si le total d'une commande Sénégal avec paiement à la livraison dépasse le seuil,
              un message d'acompte sera affiché au client dans le checkout.
              Mettez <strong>0</strong> pour désactiver cette règle.
            </p>
          </div>

          <SettingInput
            label="Seuil d'acompte (FCFA)"
            value={form.deposit_threshold}
            onChange={update('deposit_threshold')}
            placeholder="100000"
            type="number"
            hint="Ex: 100000 → acompte demandé pour toute commande ≥ 100 000 FCFA. 0 = désactivé."
          />
          <SettingInput
            label="Pourcentage d'acompte (%)"
            value={form.deposit_percent}
            onChange={update('deposit_percent')}
            placeholder="30"
            type="number"
            hint="Ex: 30 → le client paie 30% à l'avance, le reste à la livraison."
          />
        </div>

        {/* ── Livraison Congo ── */}
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
            <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center">
              <Globe size={15} className="text-purple-600" />
            </div>
            <div>
              <h2 className="font-semibold text-stone-900">Livraison Congo (International)</h2>
              <p className="text-xs text-stone-400">
                Paiement intégral requis avant expédition — COD non disponible
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
            <p className="text-xs text-blue-700 leading-relaxed">
              Pour les destinations Congo, seul le <strong>Mobile Money (prépayé)</strong> est accepté.
              Les numéros configurés ci-dessus (Wave, Orange, Free) seront affichés
              directement dans le checkout avec bouton copier.
            </p>
          </div>

          <SettingInput
            label="Tarif Congo – Express (FCFA)"
            value={form.congo_express_rate}
            onChange={update('congo_express_rate')}
            placeholder="15000"
            hint="Affiché et appliqué pour la destination Congo Express"
          />
          <SettingInput
            label="Tarif Congo – Groupage (FCFA)"
            value={form.congo_groupage_rate}
            onChange={update('congo_groupage_rate')}
            placeholder="8000"
            hint="Affiché et appliqué pour la destination Congo Groupage"
          />
          <SettingInput
            label="Cadeau inclus dans le groupage"
            value={form.congo_groupage_gift}
            onChange={update('congo_groupage_gift')}
            placeholder="un cadeau surprise"
            hint="Texte affiché au client (ex: un soin hydratant offert)"
          />
        </div>

        {/* ── Bouton save ── */}
        <button
          onClick={() => saveSettings(form)}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-semibold transition-colors shadow-sm"
        >
          {saved
            ? <><CheckCircle size={18} /> Sauvegardé !</>
            : isPending
            ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sauvegarde...</>
            : <><Save size={18} /> Sauvegarder les paramètres</>
          }
        </button>
      </div>
    </div>
  );
}
