import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/shared/EmptyState';
import Spinner from '../../components/ui/Spinner';
import { toast } from 'sonner';

export default function Cart() {
  const { cart, loading, fetchCart, updateItem, removeItem, getTotalPrice } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => { fetchCart(user?.id); }, [user?.id]);

  const items = cart?.items || [];

  const handleUpdate = async (itemId, quantity) => {
    try { await updateItem(user?.id, itemId, quantity); }
    catch { toast.error('Erreur de mise à jour'); }
  };

  const handleRemove = async (itemId) => {
    try { await removeItem(user?.id, itemId); toast.success('Article retiré'); }
    catch { toast.error('Erreur'); }
  };

  if (loading) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-stone-800 mb-8">Mon panier</h1>

      {items.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="Votre panier est vide"
          description="Ajoutez des produits pour commencer vos achats"
          action={<Link to="/products"><Button>Découvrir la boutique</Button></Link>}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-100 p-4 flex gap-4">
                <div className="w-20 h-20 rounded-xl bg-stone-50 overflow-hidden shrink-0">
                  {item.product.images?.[0] ? (
                    <img src={item.product.images.find((i) => i.isMain)?.url || item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-stone-800 text-sm truncate">{item.product.name}</h3>
                  {item.variant && (
                    <p className="text-xs text-stone-400 mt-0.5">{item.variant.size} — {item.variant.color}</p>
                  )}
                  <p className="text-rose-500 font-semibold text-sm mt-1">{formatPrice(item.product.price)}</p>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleUpdate(item.id, Math.max(1, item.quantity - 1))} className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">{item.quantity}</span>
                      <button onClick={() => handleUpdate(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <button onClick={() => handleRemove(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-500 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Récap */}
          <div className="bg-white rounded-2xl border border-stone-100 p-5 h-fit space-y-4">
            <h2 className="font-semibold text-stone-800">Récapitulatif</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Sous-total ({items.length} article{items.length > 1 ? 's' : ''})</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Livraison</span>
                <span className="text-green-600">À calculer</span>
              </div>
            </div>

            <div className="border-t border-stone-100 pt-3 flex justify-between font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>

            <Link to="/checkout" className="block">
              <Button className="w-full" size="lg">
                Passer la commande <ArrowRight size={16} />
              </Button>
            </Link>
            <Link to="/products" className="block">
              <Button variant="ghost" className="w-full" size="md">
                Continuer les achats
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
