import { useState, useEffect } from 'react';
import { X, Download, Bell, Zap, Package, Tag } from 'lucide-react';
import OneSignal from 'react-onesignal';

const STORAGE_KEY = 'pwa_banner_dismissed';

function getDeviceType() {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
  if (/android/i.test(ua)) return 'android';
  return 'desktop';
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

export default function PWAInstallBanner() {
  const [show, setShow]               = useState(false);
  const [step, setStep]               = useState('banner');
  const [deferredPrompt, setDeferred] = useState(null);
  const [device, setDevice]           = useState('desktop');
  const [notifStatus, setNotifStatus] = useState('default');

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;

    setDevice(getDeviceType());

    // ✅ Lire le statut permission depuis OneSignal (déjà initialisé dans main.jsx)
    try {
      const granted = OneSignal.Notifications.permission;
      setNotifStatus(granted ? 'granted' : 'default');
    } catch {
      if ('Notification' in window) setNotifStatus(Notification.permission);
    }

    const handler = (e) => { e.preventDefault(); setDeferred(e); };
    window.addEventListener('beforeinstallprompt', handler);

    const t = setTimeout(() => setShow(true), 4000);
    return () => { clearTimeout(t); window.removeEventListener('beforeinstallprompt', handler); };
  }, []);

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') { dismiss(); return; }
    }
    setStep('guide');
  };

  // ✅ OneSignal déjà initialisé — on appelle directement, pas d'import dynamique
  const requestNotifications = async () => {
    try {
      await OneSignal.Notifications.requestPermission();
      const granted = OneSignal.Notifications.permission;
      setNotifStatus(granted ? 'granted' : 'denied');
    } catch (e) {
      console.error('OneSignal requestPermission error:', e);
    }
  };

  if (!show) return null;

  // ── Guide ──────────────────────────────────────────────────────────────────
  if (step === 'guide') {
    const iosSteps = [
      { icon: '⬆️', text: "Appuyez sur le bouton Partager (rectangle avec flèche vers le haut) en bas de Safari" },
      { icon: '📲', text: "Faites défiler et appuyez sur « Sur l'écran d'accueil »" },
      { icon: '✅', text: "Appuyez sur « Ajouter » en haut à droite" },
    ];
    const androidSteps = [
      { icon: '⋮',  text: "Appuyez sur les 3 points en haut à droite de Chrome" },
      { icon: '📲', text: "Appuyez sur « Ajouter à l'écran d'accueil »" },
      { icon: '✅', text: "Confirmez en appuyant sur « Ajouter »" },
    ];
    const desktopSteps = [
      { icon: '⬇️', text: "Cliquez sur l'icône d'installation dans la barre d'adresse (Chrome/Edge)" },
      { icon: '✅', text: "Cliquez sur « Installer »" },
    ];
    const steps = device === 'ios' ? iosSteps : device === 'android' ? androidSteps : desktopSteps;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-stone-900">Comment installer l'app ?</h2>
            <button onClick={dismiss} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
          </div>

          <div className="space-y-4">
            {steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-50 flex items-center justify-center text-lg shrink-0">{s.icon}</div>
                <p className="text-sm text-stone-700 leading-relaxed pt-1">{s.text}</p>
              </div>
            ))}
          </div>

          {notifStatus === 'default' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-2">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
                <Bell size={13} /> Activer les notifications
              </p>
              <p className="text-xs text-amber-700">Recevez vos confirmations de commande et nos promotions exclusives.</p>
              <button
                onClick={requestNotifications}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors"
              >
                Autoriser les notifications
              </button>
            </div>
          )}
          {notifStatus === 'granted' && (
            <p className="text-xs text-emerald-600 font-medium text-center">✅ Notifications activées !</p>
          )}

          <button onClick={dismiss} className="w-full border border-stone-200 text-stone-500 text-sm py-2.5 rounded-xl hover:bg-stone-50">
            Fermer
          </button>
        </div>
      </div>
    );
  }

  // ── Bannière principale ───────────────────────────────────────────────────
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:w-96">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 overflow-hidden">
        <div className="bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-xl">🛍️</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Installer SonShop</p>
              <p className="text-rose-100 text-xs">Application gratuite</p>
            </div>
          </div>
          <button onClick={dismiss} className="text-white/70 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-3 space-y-2">
          {[
            { icon: <Zap size={14} className="text-rose-500" />,     text: 'Commandez en 1 clic, sans chercher le lien' },
            { icon: <Bell size={14} className="text-rose-500" />,    text: 'Notifications pour vos commandes et promos' },
            { icon: <Package size={14} className="text-rose-500" />, text: 'Suivez vos livraisons en temps réel' },
            { icon: <Tag size={14} className="text-rose-500" />,     text: 'Accès rapide aux offres exclusives' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 shrink-0 flex items-center justify-center">{item.icon}</div>
              <p className="text-xs text-stone-700">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="px-4 pb-4 space-y-2">
          <button
            onClick={handleInstall}
            className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm py-3 rounded-xl transition-colors"
          >
            <Download size={16} />
            Installer l'application
          </button>
          <button onClick={dismiss} className="w-full text-xs text-stone-400 hover:text-stone-600 py-1">
            Non merci, continuer sur le navigateur
          </button>
        </div>
      </div>
    </div>
  );
}