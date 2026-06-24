import Badge from '../ui/Badge';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../utils/constants';

const statusVariant = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  PROCESSING: 'purple',
  SHIPPED: 'indigo',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

export default function OrderStatusBadge({ status }) {
  return (
    <Badge variant={statusVariant[status] || 'default'}>
      {ORDER_STATUS_LABELS[status] || status}
    </Badge>
  );
}
