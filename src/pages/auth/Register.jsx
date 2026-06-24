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
  firstName: z.string().min(2, 'Prénom requis'),
  lastName:  z.string().min(2, 'Nom requis'),
  email:     z.string().email('Email invalide'),
  phone:     z.string().optional(),
  password:  z.string().min(6, 'Minimum 6 caractères'),
  confirm:   z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirm'],
});

export default function Register() {
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    setErrorMsg('');
    try {
      await registerUser(data);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Erreur lors de la création du compte';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* ✅ Mini navbar identique à Login */}
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

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-stone-800">Créer un compte</h1>
            <p className="text-stone-400 text-sm mt-1">Rejoignez la communauté SonShop</p>
          </div>

          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-4">

            {/* ✅ Message d'erreur visible */}
            {errorMsg && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
                <p className="text-sm text-rose-600 font-medium">{errorMsg}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" placeholder="Marie"  error={errors.firstName?.message} {...register('firstName')} />
              <Input label="Nom"    placeholder="Dupont" error={errors.lastName?.message}  {...register('lastName')} />
            </div>
            <Input label="Email"               type="email" placeholder="vous@exemple.com"    error={errors.email?.message}    {...register('email')} />
            <Input label="Téléphone (optionnel)" type="tel" placeholder="+221 77 000 00 00"                                    {...register('phone')} />
            <Input label="Mot de passe"        type="password" placeholder="••••••••"         error={errors.password?.message} {...register('password')} />
            <Input label="Confirmer le mot de passe" type="password" placeholder="••••••••"   error={errors.confirm?.message}  {...register('confirm')} />

            <Button type="submit" className="w-full" loading={loading} onClick={handleSubmit(onSubmit)}>
              Créer mon compte
            </Button>
          </div>

          <p className="text-center text-sm text-stone-400 mt-4">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}