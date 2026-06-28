import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { ArrowLeft, CheckCircle, Zap } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Schémas de validation par étape ──────────────────────────────────────────

const schemaEmail = z.object({
  email: z.string().email('Email invalide'),
});

const schemaCode = z.object({
  code: z.string().length(6, 'Le code doit faire 6 chiffres').regex(/^\d+$/, 'Chiffres uniquement'),
});

const schemaPassword = z.object({
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  phone:     z.string().optional(),
  password:  z.string().min(6, 'Minimum 6 caractères'),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});

// ── Composant principal ───────────────────────────────────────────────────────

export default function Register() {
  const { login } = useAuth(); // ✅ login automatique après inscription

  const [step, setStep]             = useState(1);
  const [email, setEmail]           = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [loading, setLoading]       = useState(false);
  const [errorMsg, setErrorMsg]     = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  const form1 = useForm({ resolver: zodResolver(schemaEmail) });
  const form2 = useForm({ resolver: zodResolver(schemaCode) });
  const form3 = useForm({ resolver: zodResolver(schemaPassword) });

  // ── Étape 1 : demande OTP ─────────────────────────────────────────────────
  const onRequestOtp = async ({ email: emailValue }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`${API}/auth/register/request-otp`, { email: emailValue });
      setEmail(emailValue);
      setStep(2);
      startResendCooldown();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Erreur lors de l\'envoi du code.');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 : vérification OTP ────────────────────────────────────────────
  const onVerifyOtp = async ({ code }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data } = await axios.post(`${API}/auth/register/verify-otp`, { email, code });
      setSetupToken(data.setupToken);
      setStep(3);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Code invalide ou expiré.');
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 3 : finalisation + login automatique ────────────────────────────
  const onComplete = async ({ firstName, lastName, phone, password }) => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Crée le compte
      await axios.post(
        `${API}/auth/register/complete`,
        { firstName, lastName, phone, password },
        { headers: { Authorization: `Bearer ${setupToken}` } }
      );
      // 2. ✅ Connecte automatiquement l'utilisateur
      await login({ email, password });
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Erreur lors de la création du compte.');
    } finally {
      setLoading(false);
    }
  };

  // ── Renvoi du code avec cooldown 60s ──────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrorMsg('');
    try {
      await axios.post(`${API}/auth/register/request-otp`, { email });
      form2.reset();
      startResendCooldown();
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || 'Erreur lors du renvoi.');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { n: 1, label: 'Email' },
    { n: 2, label: 'Vérification' },
    { n: 3, label: 'Compte' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Navbar dark */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/60">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Zap size={20} className="text-blue-500" />
            <span className="font-bold text-lg tracking-tight text-slate-100">
              Son<span className="text-blue-400">Tech</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Accueil
            </Link>
            <Link to="/products" className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
              Boutique
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Titre */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-semibold text-slate-100">Créer un compte</h1>
            <p className="text-slate-500 text-sm mt-1">Rejoignez la communauté SonTech</p>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-8">
            {steps.map((s, i) => (
              <div key={s.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                    ${step > s.n ? 'bg-blue-600 text-white' : step === s.n ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}
                  `}>
                    {step > s.n ? <CheckCircle size={16} /> : s.n}
                  </div>
                  <span className={`text-xs mt-1 ${step >= s.n ? 'text-blue-400 font-medium' : 'text-slate-600'}`}>
                    {s.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mb-4 mx-1 transition-colors ${step > s.n ? 'bg-blue-600/50' : 'bg-slate-700'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl p-6 space-y-4">

            {/* Erreur */}
            {errorMsg && (
              <div className="bg-red-950/40 border border-red-500/30 rounded-xl px-4 py-3">
                <p className="text-sm text-red-400 font-medium">{errorMsg}</p>
              </div>
            )}

            {/* ── ÉTAPE 1 : Email ── */}
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Entrez votre email pour recevoir un code de vérification.
                </p>
                <Input
                  label="Email"
                  type="email"
                  placeholder="vous@exemple.com"
                  error={form1.formState.errors.email?.message}
                  {...form1.register('email')}
                />
                <button
                  onClick={form1.handleSubmit(onRequestOtp)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-700/30 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Envoi en cours...
                    </span>
                  ) : 'Recevoir le code de vérification'}
                </button>
              </div>
            )}

            {/* ── ÉTAPE 2 : Code OTP ── */}
            {step === 2 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Un code à 6 chiffres a été envoyé à <strong className="text-slate-200">{email}</strong>
                </p>
                <Input
                  label="Code de vérification"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  className="text-center text-2xl tracking-widest font-mono"
                  error={form2.formState.errors.code?.message}
                  {...form2.register('code')}
                />
                <button
                  onClick={form2.handleSubmit(onVerifyOtp)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-700/30 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Vérification...
                    </span>
                  ) : 'Valider le code'}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => { setStep(1); setErrorMsg(''); form2.reset(); }}
                    className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <ArrowLeft size={14} /> Changer d'email
                  </button>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className={`text-sm transition-colors ${resendCooldown > 0 ? 'text-slate-600 cursor-not-allowed' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : 'Renvoyer le code'}
                  </button>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 3 : Infos + mot de passe ── */}
            {step === 3 && (
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Email vérifié ✅ Complétez votre profil pour finaliser la création de votre compte.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Prénom"
                    placeholder="Marie"
                    error={form3.formState.errors.firstName?.message}
                    {...form3.register('firstName')}
                  />
                  <Input
                    label="Nom"
                    placeholder="Dupont"
                    error={form3.formState.errors.lastName?.message}
                    {...form3.register('lastName')}
                  />
                </div>
                <Input
                  label="Téléphone (optionnel)"
                  type="tel"
                  placeholder="+221 77 000 00 00"
                  {...form3.register('phone')}
                />
                <Input
                  label="Mot de passe"
                  type="password"
                  placeholder="••••••••"
                  error={form3.formState.errors.password?.message}
                  {...form3.register('password')}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  error={form3.formState.errors.confirm?.message}
                  {...form3.register('confirm')}
                />
                <button
                  onClick={form3.handleSubmit(onComplete)}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-700/30 disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Création en cours...
                    </span>
                  ) : 'Créer mon compte'}
                </button>
              </div>
            )}

          </div>

          <p className="text-center text-sm text-slate-500 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              Se connecter
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}