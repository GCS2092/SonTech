import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { ordersApi } from '../../api/orders.api';
import { formatPrice } from '../../utils/formatPrice';
import { formatDate } from '../../utils/formatDate';
import OrderStatusBadge from '../../components/shared/OrderStatusBadge';
import EmptyState from '../../components/shared/EmptyState';
import Spinner from '../../components/ui/Spinner';
import Button from '../../components/ui/Button';

export default function Orders() {
  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => ordersApi.getMyOrders().then((r) => r.data),
    staleTime: 0,
    refetchOnMount: true,
  });

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
        <h1 className="text-xl font-bold text-stone-800">Mes commandes</h1>
        <p className="text-sm text-stone-400 mt-0.5">
          {orders?.length
            ? `${orders.length} commande${orders.length > 1 ? 's' : ''}`
            : 'Historique de vos achats'}
        </p>
      </div>

      {!orders?.length ? (
        <EmptyState
          icon="📦"
          title="Aucune commande"
          description="Vous n'avez pas encore passé de commande"
          action={
            <Link to="/products">
              <Button>Découvrir la boutique</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.orderNumber}`}
              className="block bg-white rounded-2xl border border-stone-100 p-5 hover:border-rose-200 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 shrink-0">
                    <Package size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-stone-800">
                        #{order.orderNumber}
                      </span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {order.items?.length} article{order.items?.length > 1 ? 's' : ''} · {formatDate(order.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Right */}
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-sm font-bold text-stone-900">
                    {formatPrice(order.total)}
                  </p>
                  <ChevronRight
                    size={15}
                    className="text-stone-300 group-hover:text-rose-400 transition-colors"
                  />
                </div>
              </div>

              {/* Article tags */}
              {order.items?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-stone-50 flex gap-1.5 flex-wrap">
                  {order.items.slice(0, 4).map((item) => (
                    <span
                      key={item.id}
                      className="text-xs text-stone-400 bg-stone-50 rounded-lg px-2 py-1 truncate max-w-[130px]"
                    >
                      {item.productName}
                    </span>
                  ))}
                  {order.items.length > 4 && (
                    <span className="text-xs text-stone-400 bg-stone-50 rounded-lg px-2 py-1">
                      +{order.items.length - 4}
                    </span>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}