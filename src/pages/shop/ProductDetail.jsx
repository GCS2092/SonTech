import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Heart, Star, ChevronLeft, Minus, Plus, MessageCircle, ShieldCheck, Truck, Zap, Package } from 'lucide-react';
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
      className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-white font-semibold text-sm transition-all shadow-lg shadow-[#25D366]/20 active:scale-95"
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
      if (mainSwiperRef.current) mainSwiperRef.current.slideTo(0);
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

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex justify-center items-center">
      <Spinner size="lg" />
    </div>
  );
  if (!product) return (
    <div className="min-h-screen bg-slate-950 text-center py-24 text-slate-500">Produit introuvable</div>
  );

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const hasVariants = product.variants && product.variants.length > 0;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : 0;

  const ColorSection = ({ showLabel = true }) => {
    const list = displayMode === 'SIZE_FIRST' ? colorsForSize : colors;
    if (list.length === 0) return null;
    return (
      <div>
        {showLabel && (
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
            Couleur{selectedColor && <span className="ml-2 text-slate-200 font-semibold normal-case tracking-normal">{selectedColor}</span>}
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
                className={`relative flex flex-col items-center gap-1 transition-all ${!colorHasStock ? 'opacity-30 cursor-not-allowed' : ''}`}
              >
                {previewImg ? (
                  <span className={`block w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                    selectedColor === color
                      ? 'border-blue-500 scale-105 shadow-lg shadow-blue-500/30'
                      : 'border-slate-700 hover:border-slate-500'
                  }`}>
                    <img src={previewImg.url} alt={color} className="w-full h-full object-cover" />
                    {!colorHasStock && (
                      <span className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl">
                        <span className="block w-8 h-0.5 bg-slate-400 rotate-45" />
                      </span>
                    )}
                  </span>
                ) : (
                  <span className={`px-3 py-1.5 rounded-xl border text-sm font-medium min-h-[44px] flex items-center transition-all ${
                    selectedColor === color
                      ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30'
                      : 'border-slate-700 text-slate-300 hover:border-slate-500'
                  } ${!colorHasStock ? 'line-through' : ''}`}>
                    {color}
                  </span>
                )}
                <span className="text-[10px] text-slate-500 leading-none">{color}</span>
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
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">
          Taille{selectedSize && <span className="ml-2 text-slate-200 font-semibold normal-case tracking-normal">{selectedSize}</span>}
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
                className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition-all min-h-[44px] min-w-[44px] ${
                  selectedSize === size
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/30'
                    : !sizeHasStock
                    ? 'border-slate-800 text-slate-600 cursor-not-allowed line-through'
                    : 'border-slate-700 text-slate-300 hover:border-slate-500'
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
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-400 px-3 py-1.5 rounded-lg transition-colors mb-8 group"
        >
          <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Retour à la boutique
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-16">

          {/* Images */}
          <div className="space-y-3">
            <div className="relative">
              <Swiper
                key={selectedColor || 'default'}
                modules={[Navigation, Thumbs]}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                navigation
                loop={displayImages.length > 1}
                onSwiper={(s) => { mainSwiperRef.current = s; }}
                onSlideChange={(s) => setMainImg(s.realIndex)}
                className="aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-800"
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
                    <div className="w-full h-full flex items-center justify-center text-6xl text-slate-700">
                      <Package size={64} />
                    </div>
                  </SwiperSlide>
                )}

                {isOutOfStock && (
                  <div className="absolute top-3 left-3 z-10 bg-red-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    Rupture de stock
                  </div>
                )}
                {hasDiscount && !isOutOfStock && (
                  <div className="absolute top-3 left-3 z-10 bg-blue-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg">
                    -{discountPercent}%
                  </div>
                )}
              </Swiper>
            </div>

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
                    <button className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      i === mainImg
                        ? 'border-blue-500 shadow-md shadow-blue-500/20'
                        : 'border-slate-800 hover:border-slate-600'
                    }`}>
                      <img src={img.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                    </button>
                  </SwiperSlide>
                ))}
              </Swiper>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-5 pb-36 md:pb-0">
            <div>
              {product.category?.name && (
                <span className="text-xs font-medium text-blue-400 uppercase tracking-widest">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl font-bold text-slate-100 mt-1 leading-tight">{product.name}</h1>

              {avgRating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        size={13}
                        className={i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-slate-500">{avgRating} · {reviews.length} avis</span>
                </div>
              )}
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-blue-400 font-mono">{formatPrice(product.price)}</span>
              {hasDiscount && (
                <>
                  <span className="text-lg text-slate-600 line-through font-mono">{formatPrice(product.comparePrice)}</span>
                  <span className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold px-2 py-0.5 rounded-lg">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p className="text-slate-400 leading-relaxed text-sm">{product.description}</p>

            {/* Variants */}
            {hasVariants && (
              <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
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
                  <p className={`text-xs flex items-center gap-1.5 ${selectedVariant.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedVariant.stock > 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    {selectedVariant.stock > 0
                      ? `${selectedVariant.stock} en stock`
                      : 'Rupture sur cette variante'}
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            {!isOutOfStock && (
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2.5">Quantité</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-11 h-11 rounded-xl border border-slate-700 flex items-center justify-center hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-all"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center font-mono font-semibold text-slate-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(effectiveStock, quantity + 1))}
                    className="w-11 h-11 rounded-xl border border-slate-700 flex items-center justify-center hover:border-slate-500 text-slate-300 hover:text-slate-100 transition-all"
                  >
                    <Plus size={14} />
                  </button>
                  <span className="text-xs text-slate-500 ml-1">{effectiveStock} disponibles</span>
                </div>
              </div>
            )}

            {/* CTA — desktop only */}
            <div className="hidden md:flex flex-col gap-3 pt-1">
              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock || addingCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-700/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {addingCart
                    ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <ShoppingBag size={17} />
                  }
                  {isOutOfStock ? 'Rupture de stock' : 'Ajouter au panier'}
                </button>
                <button
                  onClick={handleWishlist}
                  className="w-12 h-12 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 hover:border-red-500/40 hover:bg-red-950/20 transition-all"
                >
                  <Heart size={18} />
                </button>
              </div>

              <div className="flex items-center justify-center gap-5 text-xs text-slate-600 py-1">
                <span className="flex items-center gap-1.5"><ShieldCheck size={11} className="text-slate-500" /> Paiement sécurisé</span>
                <span className="flex items-center gap-1.5"><Truck size={11} className="text-slate-500" /> Livraison suivie</span>
                <span className="flex items-center gap-1.5"><Zap size={11} className="text-slate-500" /> Stock limité</span>
              </div>

              {isOutOfStock && (
                <div className="space-y-2 pt-1">
                  <PreorderButton product={product} whatsappNumber={whatsappNumber} />
                  <p className="text-xs text-center text-slate-500">
                    Envoyez-nous un message et nous vous préviendrons dès la remise en stock.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── CTA sticky mobile ── */}
        <div
          className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 0.75rem)', paddingTop: '0.75rem', paddingLeft: '1rem', paddingRight: '1rem' }}
        >
          {isOutOfStock ? (
            <div className="space-y-2">
              <PreorderButton product={product} whatsappNumber={whatsappNumber} />
              <p className="text-xs text-center text-slate-500">Nous vous préviendrons dès la remise en stock.</p>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleWishlist}
                className="w-12 h-12 rounded-xl border border-slate-700 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all shrink-0"
              >
                <Heart size={18} />
              </button>
              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingCart}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-b from-blue-500 to-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-700/30 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                {addingCart
                  ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <ShoppingBag size={17} />
                }
                <span>Ajouter — <span className="font-mono">{formatPrice(product.price)}</span></span>
              </button>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="border-t border-slate-800 pt-12">
          <h2 className="text-lg font-bold text-slate-100 uppercase tracking-wider mb-6 flex items-center gap-2">
            <Star size={16} className="text-amber-400 fill-amber-400" />
            Avis clients {reviews?.length ? <span className="text-slate-500 font-normal normal-case tracking-normal">({reviews.length})</span> : ''}
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              {reviews?.length ? (
                reviews.map((r) => <ReviewCard key={r.id} review={r} />)
              ) : (
                <p className="text-slate-500 text-sm">Aucun avis pour l'instant. Soyez le premier !</p>
              )}
            </div>
            {isAuthenticated && (
              <div><ReviewForm productId={product.id} /></div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}