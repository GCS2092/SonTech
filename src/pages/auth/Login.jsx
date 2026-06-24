import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { Home, ShoppingBag } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Minimum 6 caractères'),
});

export default function Login() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await login(data);
    } catch (err) {
      // ✅ On affiche le message d'erreur directement dans la page
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Email ou mot de passe incorrect';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ✅ Mini navbar sur login/register pour ne pas être bloqué */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl">🛍️</span>
            <span className="font-bold text-lg tracking-tight text-stone-800">
              Son<span className="text-rose-400">Shop</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors">
              <Home size={15} /> Accueil
            </Link>
            <Link to="/products" className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-800 transition-colors">
              <ShoppingBag size={15} /> Boutique
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-stone-800">Bon retour !</h1>
            <p className="text-stone-400 text-sm mt-1">Connectez-vous à votre compte</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">

            {/* ✅ Message d'erreur visible dans la page */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-sm text-rose-600 font-medium">{errorMsg}</p>
              </div>
            )}

            <Input
              label="Email"
              type="email"
              placeholder="vous@exemple.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Mot de passe"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              onClick={handleSubmit(onSubmit)}
            >
              Se connecter
            </Button>
          </div>

          <p className="text-center text-sm text-stone-400 mt-4">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-rose-500 hover:text-rose-600 font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}