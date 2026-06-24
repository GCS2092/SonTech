import { Link } from 'react-router-dom';
import { ShoppingCart, ChevronLeft, ChevronRight, Star } from 'lucide-react';
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
  const isNew = product.isNew || false;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  // Specs courtes à afficher (ex: ["256 Go", "12 Go RAM"])
  const specs = product.specs ?? [];

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
    e.preventDefault(); e.stopPropagation();
    setCurrentIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  };
  const next = (e) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  };
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next(e) : prev(e);
  };

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className={`bg-white rounded-xl overflow-hidden border border-stone-100
        transition-all duration-200
        hover:border-blue-200 hover:shadow-[0_0_0_1px_rgba(37,99,235,0.1),0_4px_20px_rgba(37,99,235,0.08)]
        ${isOutOfStock ? 'opacity-60' : ''}`}>

        {/* Zone image */}
        <div
          className="relative aspect-square overflow-hidden bg-stone-50 flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {currentImage ? (
            <img
              src={currentImage.url}
              alt={product.name}
              className="w-4/5 h-4/5 object-contain group-hover:scale-[1.04] transition-transform duration-300"
            />
          ) : (
            <div className="text-5xl text-stone-200">📦</div>
          )}

          {/* Flèches */}
          {hasMultiple && (
            <>
              <button onClick={prev} aria-label="Image précédente"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow
                           opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <ChevronLeft size={13} />
              </button>
              <button onClick={next} aria-label="Image suivante"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 p-1.5 rounded-full shadow
                           opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <ChevronRight size={13} />
              </button>
            </>
          )}

          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 z-10">
            {hasDiscount && !isNew && (
              <span className="bg-blue-700 text-white text-[11px] font-medium px-2 py-0.5 rounded-md">
                -{discountPct}%
              </span>
            )}
            {isNew && !hasDiscount && (
              <span className="bg-slate-900 text-sky-300 text-[10px] font-medium px-2 py-0.5 rounded-md tracking-widest uppercase">
                Nouveau
              </span>
            )}
            {isOutOfStock && (
              <span className="bg-stone-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
                Rupture
              </span>
            )}
          </div>

          {/* Bouton panier */}
          {!isOutOfStock && (
            <button
              onClick={handleAddToCart}
              aria-label="Ajouter au panier"
              className="absolute bottom-2.5 right-2.5 bg-blue-700 text-white p-2 rounded-lg shadow
                         hover:bg-blue-800 active:scale-95 transition-all duration-150 z-10
                         opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0"
            >
              <ShoppingCart size={15} />
            </button>
          )}
        </div>

        {/* Infos */}
        <div className="p-3">
          <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider mb-1">
            {product.category?.name}
          </p>
          <h3 className="text-[13px] font-medium text-stone-800 line-clamp-1 mb-2">
            {product.name}
          </h3>

          {/* Chips specs */}
          {specs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {specs.slice(0, 3).map((s, i) => (
                <span key={i}
                  className="text-[10px] bg-stone-100 text-stone-500 border border-stone-200 px-1.5 py-0.5 rounded-[5px]">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Étoiles */}
          {product.rating && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex">
                {[1,2,3,4,5].map((n) => (
                  <Star key={n} size={10}
                    className={n <= Math.round(product.rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-stone-200 fill-stone-200'}
                  />
                ))}
              </div>
              {product.reviewCount && (
                <span className="text-[11px] text-stone-400">({product.reviewCount})</span>
              )}
            </div>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-stone-900 tabular-nums">
              {formatPrice(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-stone-400 line-through">
                {formatPrice(product.comparePrice)}
              </span>
            )}
          </div>
          {hasDiscount && (
            <p className="text-[11px] text-blue-600 font-medium mt-0.5">
              Économie {formatPrice(product.comparePrice - product.price)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}