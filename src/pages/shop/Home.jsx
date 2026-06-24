import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight, Zap, Truck, ShieldCheck, Cpu,
  Smartphone, Headphones, Laptop, Tv2, Camera,
  Star, ChevronRight,
} from 'lucide-react';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import ProductGrid from '../../components/shared/ProductGrid';
import Button from '../../components/ui/Button';

const STORE_ID = import.meta.env.VITE_STORE_ID;

// Avantages
const perks = [
  { icon: Truck,       label: 'Livraison partout',      desc: 'Sénégal & international' },
  { icon: ShieldCheck, label: 'Produits garantis',      desc: '100% authentiques & vérifiés' },
  { icon: Zap,         label: 'Nouveautés hebdo',       desc: 'Toujours à la pointe' },
  { icon: Star,        label: 'Mobile Money accepté',   desc: 'Wave, Orange Money…' },
];

// Catégories fixes tech
const techCategories = [
  { icon: Smartphone, label: 'Smartphones',  slug: 'smartphones',      color: 'bg-blue-50   text-blue-600   border-blue-100   hover:bg-blue-600'  },
  { icon: Laptop,     label: 'Ordinateurs',  slug: 'ordinateurs',      color: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-600' },
  { icon: Headphones, label: 'Audio',        slug: 'audio',            color: 'bg-violet-50 text-violet-600 border-violet-100 hover:bg-violet-600' },
  { icon: Tv2,        label: 'TV & Écrans',  slug: 'tv-ecrans',        color: 'bg-sky-50    text-sky-600    border-sky-100    hover:bg-sky-600'    },
  { icon: Camera,     label: 'Photo & Vidéo',slug: 'photo-video',      color: 'bg-cyan-50   text-cyan-600   border-cyan-100   hover:bg-cyan-600'   },
  { icon: Cpu,        label: 'Accessoires',  slug: 'accessoires-tech', color: 'bg-slate-50  text-slate-600  border-slate-200  hover:bg-slate-700'  },
];

// Skeleton card réutilisable
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-slate-100">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-2.5 skeleton rounded-full w-1/3" />
        <div className="h-3.5 skeleton rounded-full w-4/5" />
        <div className="h-3 skeleton rounded-full w-1/4" />
      </div>
    </div>
  );
}

export default function Home() {
  const { data: productsData, isLoading: loadingProducts } = useQuery({
    queryKey: ['products', 'featured', STORE_ID],
    queryFn: () =>
      productsApi
        .getAll({ limit: 8, featured: true, ...(STORE_ID && { storeId: STORE_ID }) })
        .then((r) => r.data),
  });

  const { data: newProducts, isLoading: loadingNew } = useQuery({
    queryKey: ['products', 'new', STORE_ID],
    queryFn: () =>
      productsApi
        .getAll({ limit: 4, sortBy: 'createdAt', order: 'desc', ...(STORE_ID && { storeId: STORE_ID }) })
        .then((r) => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  return (
    <div className="page-enter">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative bg-slate-900 overflow-hidden">
        {/* Fond décoratif */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-indigo-500/15 rounded-full blur-2xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">

            {/* Texte */}
            <div>
              <span className="inline-flex items-center gap-1.5 bg-blue-500/15 text-blue-300 text-xs font-semibold px-3 py-1.5 rounded-full mb-5 border border-blue-500/20">
                <Zap size={11} aria-hidden="true" />
                Nouveaux arrivages disponibles
              </span>

              <h1 className="text-4xl md:text-5xl lg:text-[3.25rem] font-bold text-white leading-[1.15] mb-5">
                La tech qui vous<br />
                <span className="text-blue-400">connecte au monde</span>
              </h1>

              <p className="text-slate-400 text-base md:text-lg mb-8 leading-relaxed max-w-md">
                Smartphones, ordinateurs, audio et accessoires tech authentiques.
                Livraison rapide partout au Sénégal et à l'international.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/products">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white border-0 font-semibold">
                    Voir la boutique
                    <ArrowRight size={16} aria-hidden="true" />
                  </Button>
                </Link>
                <Link to="/products?featured=true">
                  <Button
                    size="lg"
                    variant="ghost"
                    className="border border-white/15 text-slate-300 hover:bg-white/10 hover:text-white"
                  >
                    Meilleures ventes
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="flex gap-6 mt-10 pt-8 border-t border-white/10">
                {[
                  { value: '500+', label: 'Produits' },
                  { value: '4.9★', label: 'Note clients' },
                  { value: '24h',  label: 'Livraison Dakar' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p className="text-xl font-bold text-white">{value}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Visuel tech — desktop */}
            <div className="hidden md:flex justify-center">
              <div className="relative">
                {/* Grille d'icônes */}
                <div className="grid grid-cols-3 gap-4 p-2">
                  {[
                    { Icon: Smartphone, label: 'Smartphones' },
                    { Icon: Laptop,     label: 'Laptops'     },
                    { Icon: Headphones, label: 'Audio'       },
                    { Icon: Tv2,        label: 'TV'          },
                    { Icon: Cpu,        label: 'Composants'  },
                    { Icon: Camera,     label: 'Photo'       },
                  ].map(({ Icon, label }) => (
                    <div
                      key={label}
                      className="w-24 h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-blue-600/20 hover:border-blue-500/30 transition-all duration-200"
                    >
                      <Icon size={28} className="text-blue-300" aria-hidden="true" />
                      <span className="text-[10px] text-slate-500 font-medium">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Badge flottant */}
                <div className="absolute -bottom-3 -left-4 bg-white rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} className="text-green-600" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 leading-none">100% Garanti</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Produits vérifiés</p>
                  </div>
                </div>

                {/* Badge livraison */}
                <div className="absolute -top-3 -right-4 bg-blue-700 rounded-xl shadow-lg px-3 py-2.5 flex items-center gap-2">
                  <Truck size={14} className="text-blue-200" aria-hidden="true" />
                  <p className="text-xs font-bold text-white leading-none">Livraison 24h</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── AVANTAGES ────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 md:divide-x md:divide-slate-100">
            {perks.map(({ icon: Icon, label, desc }, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 ${i > 0 ? 'md:pl-6' : ''} py-2 md:py-0`}
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                  <Icon size={17} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-tight truncate">{label}</p>
                  <p className="text-xs text-slate-400 truncate">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATÉGORIES ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">Catégories</h2>
          <Link
            to="/products"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Tout voir <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {techCategories.map(({ icon: Icon, label, slug, color }) => {
            const [bg, text, border, hoverBg] = color.split(' ');
            return (
              <Link
                key={slug}
                to={`/products?category=${slug}`}
                className={`group flex flex-col items-center gap-2.5 p-4 rounded-xl border ${bg} ${border} hover:shadow-md transition-all duration-200`}
              >
                <div className={`w-11 h-11 rounded-xl ${bg} ${text} flex items-center justify-center group-hover:bg-blue-700 group-hover:text-white transition-all duration-200`}>
                  <Icon size={22} aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold text-slate-700 text-center leading-tight">{label}</p>
              </Link>
            );
          })}
        </div>

        {/* Catégories dynamiques depuis l'admin */}
        {categories?.filter(c => c.imageUrl).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {categories.filter(c => c.imageUrl).slice(0, 4).map((cat) => (
              <Link
                key={cat.id}
                to={`/products?category=${cat.slug}`}
                className="group relative rounded-xl overflow-hidden aspect-video bg-slate-100 hover:shadow-md transition-all"
              >
                <img
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <p className="absolute bottom-2.5 left-3 text-white font-semibold text-sm">{cat.name}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── NOUVEAUTÉS ───────────────────────────────────────── */}
      {(loadingNew || newProducts?.data?.length > 0 || newProducts?.length > 0) && (
        <section className="bg-slate-50 border-y border-slate-100 py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" aria-hidden="true" />
                <h2 className="text-xl font-bold text-slate-900">Nouveautés</h2>
              </div>
              <Link
                to="/products?sortBy=createdAt&order=desc"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Voir tout <ChevronRight size={15} aria-hidden="true" />
              </Link>
            </div>

            {loadingNew ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : (
              <ProductGrid products={newProducts?.data || newProducts} loading={false} />
            )}
          </div>
        </section>
      )}

      {/* ── PRODUITS VEDETTES ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-16">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-slate-900">Meilleures ventes</h2>
          <Link
            to="/products?featured=true"
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Voir tout <ChevronRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <ProductGrid products={productsData?.data || productsData} loading={false} />
        )}
      </section>

      {/* ── BANNIÈRE SONSHOP ─────────────────────────────────── */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm mb-2">Vous cherchez de la mode ?</p>
          <a
            href="https://urban-beauty.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-rose-400 hover:text-rose-300 font-semibold text-sm transition-colors group"
          >
            Découvrir SonShop — Vêtements & accessoires
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </a>
        </div>
      </section>

    </div>
  );
}