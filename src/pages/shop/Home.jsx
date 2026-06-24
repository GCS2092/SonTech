import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Zap, Truck, ShieldCheck, Cpu, Smartphone, Headphones, Laptop } from 'lucide-react';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import ProductGrid from '../../components/shared/ProductGrid';
import Button from '../../components/ui/Button';

// ← NOUVEAU : récupère l'ID de la boutique SonTech depuis .env
const STORE_ID = import.meta.env.VITE_STORE_ID;

const perks = [
  { icon: Truck, label: 'Livraison & export', desc: 'Sénégal et international' },
  { icon: ShieldCheck, label: 'Produits garantis', desc: '100% vérifiés' },
  { icon: Zap, label: 'Nouveautés chaque semaine', desc: 'Toujours à la pointe' },
];

const techCategories = [
  { icon: Smartphone, label: 'Smartphones', slug: 'smartphones' },
  { icon: Laptop, label: 'Ordinateurs', slug: 'ordinateurs' },
  { icon: Headphones, label: 'Audio', slug: 'audio' },
  { icon: Cpu, label: 'Accessoires', slug: 'accessoires-tech' },
];

export default function Home() {
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'featured', STORE_ID],
    // ← NOUVEAU : passe storeId à l'API pour ne montrer que les produits SonTech
    queryFn: () =>
      productsApi
        .getAll({ limit: 8, featured: true, ...(STORE_ID && { storeId: STORE_ID }) })
        .then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* Texte */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                <Zap size={12} /> SonTech — Nouveaux produits disponibles
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-4">
                La tech <br />
                <span className="text-blue-500">qui vous connecte</span>
              </h1>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Découvrez notre sélection de smartphones, ordinateurs et accessoires
                tech authentiques, livrés partout au Sénégal et exportés à l'international.
              </p>
              <div className="flex gap-3 flex-wrap">
                <Link to="/products">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                    Découvrir la boutique <ArrowRight size={18} />
                  </Button>
                </Link>
                <Link to="/products?featured=true">
                  <Button size="lg" variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                    Meilleures ventes
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visuel hero tech — visible desktop uniquement */}
            <div className="hidden md:block relative">
              <div className="aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-blue-200/50 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-6 p-10">
                  {[Smartphone, Laptop, Headphones, Cpu].map((Icon, i) => (
                    <div key={i} className="w-20 h-20 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center">
                      <Icon size={36} className="text-white" />
                    </div>
                  ))}
                </div>
              </div>
              {/* Badge flottant */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">100% Garanti</p>
                  <p className="text-[11px] text-slate-400">Produits vérifiés</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Décorations */}
        <div className="absolute top-10 right-10 w-64 h-64 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-48 h-48 bg-indigo-200/30 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Perks */}
      <section className="border-y border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 sm:divide-x sm:divide-slate-100">
            {perks.map(({ icon: Icon, label, desc }, i) => (
              <div key={label} className={`flex items-center gap-3 ${i > 0 ? 'sm:pl-6' : ''} flex-1 min-w-0`}>
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-500 shrink-0">
                  <Icon size={18} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{label}</p>
                  <p className="text-xs text-slate-400 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Catégories tech fixes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Catégories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {techCategories.map(({ icon: Icon, label, slug }) => (
            <Link
              key={slug}
              to={`/products?category=${slug}`}
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-md hover:border-blue-300 transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Icon size={28} />
              </div>
              <p className="font-semibold text-slate-800 text-sm text-center">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Catégories dynamiques (si tu en crées dans l'admin) */}
      {categories?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {categories.slice(0, 4).map((cat) => (
              cat.imageUrl ? (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.slug}`}
                  className="group relative bg-slate-100 rounded-2xl overflow-hidden aspect-square hover:shadow-md transition-all"
                >
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <p className="absolute bottom-3 left-3 text-white font-semibold text-sm">{cat.name}</p>
                </Link>
              ) : null
            ))}
          </div>
        </section>
      )}

      {/* Produits vedettes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Produits vedettes</h2>
          <Link to="/products" className="text-sm text-blue-500 hover:text-blue-600 font-medium flex items-center gap-1">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100">
                <div className="aspect-square bg-slate-100 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full animate-pulse w-1/2" />
                  <div className="h-4 bg-slate-100 rounded-full animate-pulse w-3/4" />
                  <div className="h-4 bg-slate-100 rounded-full animate-pulse w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid products={productsData?.data || productsData} loading={false} />
        )}
      </section>

      {/* Lien vers SonShop */}
      <section className="bg-slate-50 border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm mb-2">Vous cherchez de la mode ?</p>
          <a
            href="https://urban-beauty.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-rose-500 hover:text-rose-600 font-semibold text-sm transition-colors"
          >
            👗 Découvrir SonShop — Vêtements & accessoires <ArrowRight size={14} />
          </a>
        </div>
      </section>
    </div>
  );
}