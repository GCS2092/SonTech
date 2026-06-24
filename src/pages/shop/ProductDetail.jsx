import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, Star, ChevronLeft, Minus, Plus, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs } from 'swiper/modules';
import { productsApi } from '../../api/products.api';
import { reviewsApi } from '../../api/reviews.api';
import { wishlistApi } from '../../api/wishlist.api';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import { formatPrice } from '../../utils/formatPrice';
import { API_URL } from '../../utils/constants';
import Button from '../../components/ui/Button';
import ReviewCard from '../../components/shared/ReviewCard';
import ReviewForm from '../../components/shared/ReviewForm';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'sonner';

function PreorderButton({ product, whatsappNumber }) {
  if (!product || product.stock > 0) return null;
  const phone = (whatsappNumber || '').replace(/\D/g, '');
  if (!phone) return null;
  const variantInfo = product.variants?.length
    ? `\nVariantes disponibles : ${[...new Set(product.variants.map(v => v.size).filter(Boolean))].join(', ')}`
    : '';
  const message = [
    `Bonjour !`, ``,
    `Je suis interesse(e) par le produit suivant qui est actuellement en rupture de stock :`, ``,
    `Produit : ${product.name}`,
    `Prix : ${formatPrice(product.price)}`,
    product.category?.name ? `Categorie : ${product.category.name}` : null,
    variantInfo || null, ``,
    `Pourriez-vous m'informer des que ce produit est de nouveau disponible ?`,
    `Je souhaite passer une precommande si possible.`, ``,
    `Merci beaucoup !`,
  ].filter(l => l !== null).join('\n');
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 text-white font-semibold text-sm transition-all duration-200 shadow-sm shadow-green-200"
    >
      <MessageCircle size={18} />
      Précommander via WhatsApp
    </a>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { user, isAuthenticated } = useAuthStore();
  const { addItem } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [mainImg, setMainImg] = useState(0);
  const [thumbsSwiper, setThumbsSwiper] = useState(null);
  const [addingCart, setAddingCart] = useState(false);
  const mainSwiperRef = useRef(null);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => productsApi.getBySlug(slug).then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', product?.id],
    queryFn: () => reviewsApi.getByProduct(product.id).then((r) => r.data),
    enabled: !!product?.id,
  });

  const { data: settings } = useQuery({
    queryKey: ['settings-public'],
    queryFn: () => fetch(`${API_URL}/api/settings`).then((r) => r.json()),
    staleTime: 1000 * 60 * 10,
  });

  const whatsappNumber = settings?.whatsapp_number || '';

  const avgRating = reviews?.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  const allImages = product?.images?.sort((a, b) => a.position - b.position) || [];

  const displayImages = (() => {
    if (!selectedColor) return allImages;
    const colorImgs = allImages.filter((img) => img.color === selectedColor);
    return colorImgs.length > 0 ? colorImgs : allImages;
  })();

  const displayMode = product?.variantDisplayMode || 'SIZE_FIRST';
  const sizes = [...new Set((product?.variants || []).map((v) => v.size).filter(Boolean))];
  const colors = [...new Set((product?.variants || []).map((v) => v.color).filter(Boolean))];

  const colorsForSize = selectedSize
    ? [...new Set(
        (product?.variants || [])
          .filter((v) => v.size === selectedSize)
          .map((v) => v.color).filter(Boolean)
      )]
    : colors;

  const sizesForColor = selectedColor
    ? [...new Set(
        (product?.variants || [])
          .filter((v) => v.color === selectedColor)
          .map((v) => v.size).filter(Boolean)
      )]
    : sizes;

  const handleSelectSize = (size) => {
    setSelectedSize(size);
    const colorsAvailable = (product?.variants || [])
      .filter((v) => v.size === size).map((v) => v.color).filter(Boolean);
    const newColor = colorsAvailable.includes(selectedColor)
      ? selectedColor : (colorsAvailable[0] || null);
    setSelectedColor(newColor);
    const variant = (product?.variants || []).find(
      (v) => v.size === size && v.color === newColor
    );
    setSelectedVariant(variant || null);
    if (newColor) jumpToColorImage(newColor);
  };

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    if (displayMode === 'COLOR_FIRST') {
      const sizesAvailable = (product?.variants || [])
        .filter((v) => v.color === color).map((v) => v.size).filter(Boolean);
      const newSize = sizesAvailable.includes(selectedSize)
        ? selectedSize : (sizesAvailable[0] || null);
      setSelectedSize(newSize);
      const variant = (product?.variants || []).find(
        (v) => v.color === color && v.size === newSize
      );
      setSelectedVariant(variant || null);
    } else {
      const variant = (product?.variants || []).find(
        (v) => v.size === selectedSize && v.color === color
      );
      setSelectedVariant(variant || null);
    }
    jumpToColorImage(color);
  };

  const jumpToColorImage = (color) => {
    const colorImgs = allImages.filter((img) => img.color === color);
    if (colorImgs.length === 0) return;
    setTimeout(() => {
      if (mainSwiperRef.current) {
        mainSwiperRef.current.slideTo(0);
      }
    }, 50);
  };

  const effectiveStock = selectedVariant ? selectedVariant.stock : (product?.stock ?? 0);
  const isOutOfStock = effectiveStock === 0;

  const handleAddToCart = async () => {
    setAddingCart(true);
    try {
      await addItem(user?.id, {
        productId: product.id,
        variantId: selectedVariant?.id || null,
        quantity,
      });
      toast.success('Ajouté au panier !');
    } catch {
      toast.error("Erreur lors de l'ajout");
    } finally {
      setAddingCart(false);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) return toast.error('Connectez-vous pour ajouter aux favoris');
    try {
      await wishlistApi.add(product.id);
      toast.success('Ajouté aux favoris !');
    } catch {
      toast.error('Déjà dans vos favoris');
    }
  };

  if (isLoading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;
  if (!product) return <div className="text-center py-24 text-stone-400">Produit introuvable</div>;

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const hasVariants = product.variants && product.variants.length > 0;

  const ColorSection = ({ showLabel = true }) => {
    const list = displayMode === 'SIZE_FIRST' ? colorsForSize : colors;
    if (list.length === 0) return null;
    return (
      <div>
        {showLabel && (
          <p className="text-sm font-medium text-stone-700 mb-2">
            Couleur{selectedColor && <span className="ml-2 text-stone-600 font-semibold">{selectedColor}</span>}
          </p>
        )}
        <div className="flex gap-2 flex-wrap">
          {list.map((color) => {
            const previewImg = allImages.find((img) => img.color === color);
            const colorHasStock = (product.variants || []).some(
              (v) => v.color === color &&
                (!selectedSize || displayMode === 'COLOR_FIRST' || v.size === selectedSize) &&
                v.stock > 0
            );
            return (
              <button
                key={color}
                onClick={() => handleSelectColor(color)}
                disabled={!colorHasStock}
                title={color}
                className={`relative flex flex-col items-center gap-1 transition-all ${!colorHasStock ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                {previewImg ? (
                  <span className={`block w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedColor === color ? 'border-stone-900 scale-105 shadow-md' : 'border-stone-200 hover:border-stone-400'
                  }`}>
                    <img src={previewImg.url} alt={color} className="w-full h-full object-cover" />
                    {!colorHasStock && (
                      <span className="absolute inset-0 flex items-center justify-center bg-white/60 rounded-xl">
                        <span className="block w-8 h-0.5 bg-stone-400 rotate-45" />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl border text-sm font-medium min-h-[44px] flex items-center ${
                    selectedColor === color
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'border-stone-200 text-stone-600 hover:border-stone-400'
                  } ${!colorHasStock ? 'line-through' : ''}`}>
                    {color}
                  </span>
                )}
                <span className="text-[10px] text-stone-500 leading-none">{color}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const SizeSection = () => {
    const list = displayMode === 'COLOR_FIRST' ? sizesForColor : sizes;
    if (list.length === 0) return null;
    return (
      <div>
        <p className="text-sm font-medium text-stone-700 mb-2">
          Taille{selectedSize && <span className="ml-2 text-stone-600 font-semibold">{selectedSize}</span>}
        </p>
        <div className="flex gap-2 flex-wrap">
          {list.map((size) => {
            const sizeHasStock = (product.variants || []).some(
              (v) => v.size === size &&
                (!selectedColor || displayMode === 'SIZE_FIRST' || v.color === selectedColor) &&
                v.stock > 0
            );
            return (
              <button
                key={size}
                onClick={() => handleSelectSize(size)}
                disabled={!sizeHasStock}
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-colors min-h-[44px] min-w-[44px] ${
                  selectedSize === size
                    ? 'bg-stone-900 text-white border-stone-900'
                    : !sizeHasStock
                    ? 'border-stone-100 text-stone-300 cursor-not-allowed line-through'
                    : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-800 hover:bg-stone-100 px-3 py-1.5 rounded-lg transition-colors mb-6"
      >
        <ChevronLeft size={16} />
        Retour à la boutique
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">

        {/* Images */}
        <div className="space-y-3">
          <Swiper
            key={selectedColor || 'default'}
            modules={[Navigation, Thumbs]}
            thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
            navigation
            loop={displayImages.length > 1}
            onSwiper={(s) => { mainSwiperRef.current = s; }}
            onSlideChange={(s) => setMainImg(s.realIndex)}
            className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative"
          >
            {displayImages.length ? displayImages.map((img, i) => (
              <SwiperSlide key={img.id || i}>
                <img
                  src={img.url}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </SwiperSlide>
            )) : (
              <SwiperSlide>
                <div className="w-full h-full flex items-center justify-center text-6xl">🛍️</div>
              </SwiperSlide>
            )}
            {isOutOfStock && (
              <div className="absolute top-3 left-3 z-10 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                Rupture de stock
              </div>
            )}
          </Swiper>

          {displayImages.length > 1 && (
            <Swiper
              key={`thumbs-${selectedColor || 'default'}`}
              modules={[Thumbs]}
              onSwiper={setThumbsSwiper}
              slidesPerView={4}
              spaceBetween={8}
              watchSlidesProgress
              className="w-full"
            >
              {displayImages.map((img, i) => (
                <SwiperSlide key={img.id || i}>
                  <button className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                    i === mainImg ? 'border-stone-800' : 'border-transparent hover:border-stone-300'
                  }`}>
                    <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>

        {/* Infos produit */}
        {/* pb-36 sur mobile pour laisser de la place au CTA sticky */}
        <div className="space-y-5 pb-36 md:pb-0">
          <div>
            <p className="text-sm text-stone-500 font-medium mb-1">{product.category?.name}</p>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">{product.name}</h1>
            {avgRating && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={14} className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-stone-200'} />
                  ))}
                </div>
                <span className="text-sm text-stone-500">{avgRating} ({reviews.length} avis)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-stone-900">{formatPrice(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-stone-400 line-through">{formatPrice(product.comparePrice)}</span>
                <span className="bg-stone-800 text-white text-sm font-bold px-2 py-0.5 rounded-full">
                  -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                </span>
              </>
            )}
          </div>

          <p className="text-stone-500 leading-relaxed">{product.description}</p>

          {/* Variantes */}
          {hasVariants && (
            <div className="space-y-4">
              {displayMode === 'COLOR_FIRST' ? (
                <>
                  <ColorSection />
                  {selectedColor && <SizeSection />}
                </>
              ) : (
                <>
                  <SizeSection />
                  {(selectedSize || sizes.length === 0) && <ColorSection />}
                </>
              )}
              {selectedVariant && (
                <p className="text-xs text-stone-400">
                  {selectedVariant.stock > 0
                    ? `${selectedVariant.stock} en stock pour cette variante`
                    : 'Cette variante est en rupture de stock'}
                </p>
              )}
            </div>
          )}

          {/* Quantité — visible sur tous les écrans */}
          {!isOutOfStock && (
            <div>
              <p className="text-sm font-medium text-stone-700 mb-2">Quantité</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-11 h-11 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Minus size={14} />
                </button>
                <span className="w-8 text-center font-semibold text-stone-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                  className="w-11 h-11 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                >
                  <Plus size={14} />
                </button>
                <span className="text-xs text-stone-400 ml-1">{effectiveStock} en stock</span>
              </div>
            </div>
          )}

          {/* CTA desktop uniquement */}
          <div className="hidden md:flex flex-col gap-3 pt-2">
            <div className="flex gap-3">
              <Button
                className="flex-1"
                size="lg"
                loading={addingCart}
                disabled={isOutOfStock}
                onClick={handleAddToCart}
              >
                <ShoppingBag size={18} />
                {isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
              </Button>
              <button
                onClick={handleWishlist}
                className="w-12 h-12 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:border-stone-400 transition-colors"
              >
                <Heart size={20} />
              </button>
            </div>
            <div className="flex items-center justify-center gap-4 text-xs text-stone-400 py-1">
              <span className="flex items-center gap-1"><ShieldCheck size={12} /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Truck size={12} /> Livraison suivie</span>
            </div>
            {isOutOfStock && (
              <div className="space-y-2">
                <PreorderButton product={product} whatsappNumber={whatsappNumber} />
                <p className="text-xs text-center text-stone-400">
                  Envoyez-nous un message et nous vous préviendrons dès la remise en stock.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CTA sticky mobile ── */}
      <div
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 shadow-lg z-40"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)', paddingTop: '0.75rem', paddingLeft: '1rem', paddingRight: '1rem' }}
      >
        {isOutOfStock ? (
          <div className="space-y-2">
            <PreorderButton product={product} whatsappNumber={whatsappNumber} />
            <p className="text-xs text-center text-stone-400">
              Nous vous préviendrons dès la remise en stock.
            </p>
          </div>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={handleWishlist}
              className="w-12 h-12 rounded-xl border border-stone-200 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors shrink-0"
            >
              <Heart size={20} />
            </button>
            <Button
              className="flex-1"
              size="lg"
              loading={addingCart}
              disabled={isOutOfStock}
              onClick={handleAddToCart}
            >
              <ShoppingBag size={18} />
              <span>Ajouter — {formatPrice(product.price)}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Avis */}
      <div className="border-t border-stone-100 pt-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">
          Avis clients {reviews?.length ? `(${reviews.length})` : ''}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {reviews?.length ? (
              reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            ) : (
              <p className="text-stone-400 text-sm">Aucun avis pour l'instant. Soyez le premier !</p>
            )}
          </div>
          {isAuthenticated && (
            <div><ReviewForm productId={product.id} /></div>
          )}
        </div>
      </div>
    </div>
  );
}