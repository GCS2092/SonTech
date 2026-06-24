import { Link } from 'react-router-dom';
import { ShoppingBag, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatPrice } from '../../utils/formatPrice';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { toast } from 'sonner';
import { useState, useRef } from 'react';

export default function ProductCard({ product }) {
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);

  const images = product.images ?? [];
  const hasMultiple = images.length > 1;
  const currentImage = images[currentIndex];

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addItem(user?.id, { productId: product.id, quantity: 1 });
      toast.success('Ajouté au panier !');
    } catch {
      toast.error("Erreur lors de l'ajout");
    }
  };

  const prev = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };

  const next = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };

  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next(e) : prev(e);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:shadow-lg transition-all duration-300">

        {/* Zone image */}
        <div
          className="relative aspect-square overflow-hidden bg-stone-100"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {currentImage ? (
            <img
              src={currentImage.url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-stone-300">
              🛍️
            </div>
          )}

          {/* Flèches — toujours visibles sur mobile, hover sur desktop */}
          {hasMultiple && (
            <>
              <button
                onClick={prev}
                aria-label="Image précédente"
                className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow
                           opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-10"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={next}
                aria-label="Image suivante"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow
                           opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 z-10"
              >
                <ChevronRight size={14} />
              </button>

              {/* Dots */}
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                {images.map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-full transition-all duration-200 ${
                      i === currentIndex ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {hasDiscount && (
              <span className="bg-stone-900 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{Math.round((1 - product.price / product.comparePrice) * 100)}%
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-stone-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Rupture
              </span>
            )}
          </div>

          {/* Bouton panier
              Mobile  : toujours visible (opacity-100)
              Desktop : apparaît au hover (md:opacity-0 md:group-hover:opacity-100)
          */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              aria-label="Ajouter au panier"
              className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm p-2.5 rounded-xl shadow-md
                         hover:bg-stone-900 hover:text-white active:scale-95 transition-all duration-200 z-10
                         opacity-100 md:opacity-0 md:group-hover:opacity-100
                         translate-y-0 md:translate-y-1 md:group-hover:translate-y-0"
            >
              <ShoppingBag size={16} />
            </button>
          )}
        </div>

        {/* Infos */}
        <div className="p-3">
          <p className="text-xs text-stone-400 mb-0.5">{product.category?.name}</p>
          <h3 className="text-sm font-semibold text-stone-800 line-clamp-1 mb-1">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-900 text-sm">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">{formatPrice(product.comparePrice)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}