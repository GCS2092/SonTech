import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { wishlistApi } from '../../api/wishlist.api';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { formatPrice } from '../../utils/formatPrice';
import { getMainImage } from '../../utils/imageUrl';
import EmptyState from '../../components/shared/EmptyState';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';
import { toast } from 'sonner';

export default function Wishlist() {
  const { user }    = useAuthStore();
  const { addItem } = useCartStore();
  const queryClient = useQueryClient();

  const { data: wishlist, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => wishlistApi.getAll().then((r) => r.data),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (productId) => wishlistApi.remove(productId),
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success('Retiré des favoris');
    },
  });

  const handleAddToCart = async (item) => {
    try {
      await addItem(user?.id, { productId: item.product.id, quantity: 1 });
      toast.success('Ajouté au panier !');
    } catch {
      toast.error("Impossible d'ajouter au panier");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-stone-800 flex items-center gap-2">
          Mes favoris
          {wishlist?.length > 0 && (
            <span className="text-base font-normal text-stone-400">
              ({wishlist.length})
            </span>
          )}
        </h1>
        <p className="text-sm text-stone-400 mt-0.5">
          Les produits que vous avez sauvegardés
        </p>
      </div>

      {!wishlist?.length ? (
        <EmptyState
          icon={<Heart size={32} className="text-rose-300" />}
          title="Aucun favori"
          description="Ajoutez des produits à vos favoris pour les retrouver facilement"
          action={
            <Link to="/products">
              <Button>Découvrir la boutique</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {wishlist.map((item) => {
            const product = item.product;
            const mainImg = getMainImage(product.images);

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-stone-100 overflow-hidden group flex flex-col"
              >
                {/* Image */}
                <Link
                  to={`/products/${product.slug}`}
                  className="relative block aspect-square bg-stone-50 overflow-hidden"
                >
                  {mainImg ? (
                    <img
                      src={mainImg.url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-50 text-3xl">
                      🛍️
                    </div>
                  )}

                  {/* Bouton supprimer */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      remove(product.id);
                    }}
                    aria-label="Retirer des favoris"
                    className="absolute top-2 right-2 w-7 h-7 rounded-xl bg-white/90 backdrop-blur-sm border border-stone-100 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                </Link>

                {/* Body */}
                <div className="p-3 flex flex-col flex-1">
                  <Link to={`/products/${product.slug}`}>
                    <h3 className="text-xs font-semibold text-stone-800 hover:text-rose-500 transition-colors line-clamp-2 leading-snug">
                      {product.name}
                    </h3>
                  </Link>
                  <p className="text-sm font-bold text-stone-900 mt-1.5 mb-3">
                    {formatPrice(product.price)}
                  </p>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="mt-auto w-full flex items-center justify-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    <ShoppingBag size={12} /> Ajouter au panier
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}