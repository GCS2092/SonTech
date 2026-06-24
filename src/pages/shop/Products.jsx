import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { productsApi } from '../../api/products.api';
import { categoriesApi } from '../../api/categories.api';
import ProductGrid from '../../components/shared/ProductGrid';
import Pagination from '../../components/shared/Pagination';

// ← NOUVEAU : récupère l'ID de la boutique SonTech depuis .env
const STORE_ID = import.meta.env.VITE_STORE_ID;

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const page = Number(searchParams.get('page') || 1);
  const category = searchParams.get('category') || '';

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, category, search, storeId: STORE_ID }],
    // ← NOUVEAU : passe storeId à l'API pour ne montrer que les produits SonTech
    queryFn: () =>
      productsApi
        .getAll({ page, limit: 12, category, search, ...(STORE_ID && { storeId: STORE_ID }) })
        .then((r) => r.data),
    keepPreviousData: true,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll().then((r) => r.data),
  });

  const setParam = (key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.delete('page');
    setSearchParams(p);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setParam('search', search);
  };

  const products = data?.data || data || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-1">Boutique</h1>
        <p className="text-slate-400 text-sm">
          {data?.total ? `${data.total} produits disponibles` : 'Découvrez notre catalogue tech'}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
            Chercher
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setParam('category', '')}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              !category ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Tous
          </button>
          {categories?.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setParam('category', cat.slug)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                category === cat.slug ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grille */}
      <ProductGrid products={products} loading={isLoading} />

      {/* Pagination */}
      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={(p) => {
          const params = new URLSearchParams(searchParams);
          params.set('page', p);
          setSearchParams(params);
        }}
      />
    </div>
  );
}