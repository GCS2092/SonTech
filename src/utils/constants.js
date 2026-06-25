export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const STORE_ID = import.meta.env.VITE_STORE_ID || '1d791ecc-7f71-4fa8-bcc9-9e62cbe700e9';

export const ROLES = {
  CUSTOMER: 'CUSTOMER',
  ADMIN: 'ADMIN',
};

export const ORDER_STATUS = {
  DRAFT: 'DRAFT',
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
};

export const ORDER_STATUS_LABELS = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En traitement',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

export const ORDER_STATUS_COLORS = {
  DRAFT: 'bg-stone-100 text-stone-500',
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  SHIPPED: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: 'CASH_ON_DELIVERY',
  MOBILE_MONEY: 'MOBILE_MONEY',
};

export const PAYMENT_METHOD_LABELS = {
  CASH_ON_DELIVERY: 'Paiement à la livraison',
  MOBILE_MONEY: 'Mobile Money',
};

export const PAYMENT_STATUS_LABELS = {
  PENDING: 'En attente',
  PARTIAL: 'Partiel',
  PAID: 'Payé',
};

export const DISCOUNT_TYPES = {
  PERCENTAGE: 'PERCENTAGE',
  FIXED: 'FIXED',
};

export const NOTIFICATION_TYPE_LABELS = {
  ORDER_CONFIRMED: 'Commande confirmée',
  ORDER_SHIPPED: 'Commande expédiée',
  ORDER_DELIVERED: 'Commande livrée',
  ORDER_CANCELLED: 'Commande annulée',
  PAYMENT_RECEIVED: 'Paiement reçu',
  PROMO: 'Promotion',
};

export const ANONYMOUS_CART_KEY = 'urban_anonymous_id';
export const AUTH_TOKEN_KEY = 'urban_token';