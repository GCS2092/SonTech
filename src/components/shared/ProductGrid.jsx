import ProductCard from './ProductCard';
import Spinner from '../ui/Spinner';
import EmptyState from './EmptyState';

export default function ProductGrid({ products, loading }) {
  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!products?.length) {
    return (
      <EmptyState
        icon="??"
        title="Aucun produit trouvé"
        description="Essayez de modifier vos filtres de recherche"
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
