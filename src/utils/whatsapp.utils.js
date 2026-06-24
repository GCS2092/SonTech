import { formatPrice } from './formatPrice';

const DEFAULT_COUNTRY_CODE = '221';

export function normalizePhoneForWhatsApp(phone, countryCode = DEFAULT_COUNTRY_CODE) {
  if (!phone) return null;
  let digits = String(phone).replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith(countryCode)) return digits;
  if (digits.startsWith('0')) digits = digits.slice(1);
  return `${countryCode}${digits}`;
}

function buildWaLink(phone, message) {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

function getOrderContact(order) {
  return {
    phone: order.user?.phone || order.guestPhone || null,
    name:  order.user?.firstName || order.guestName || 'Client',
  };
}

const CLIENT_URL =
  import.meta.env.VITE_CLIENT_URL ||
  import.meta.env.VITE_API_URL?.replace(':5000', ':5173') ||
  'http://localhost:5173';

const STATUS_MESSAGES = {
  CONFIRMED:  'a été confirmée ✅',
  PROCESSING: 'est en cours de préparation 🔄',
  SHIPPED:    'a été expédiée 🚚',
  DELIVERED:  'a été livrée 🎉',
  CANCELLED:  'a été annulée ❌',
};

/** Lien WhatsApp — confirmation de commande (bouton rapide dans la liste) */
export function buildOrderConfirmationWhatsAppLink(order) {
  const { phone, name } = getOrderContact(order);
  const lines = [
    `Bonjour ${name} 👋`,
    '',
    `Votre commande n°${order.orderNumber} a bien été enregistrée.`,
    `Total : ${formatPrice(order.total)}`,
    '',
    `Suivez votre commande ici : ${CLIENT_URL}/orders/${order.orderNumber}`,
    '',
    'Merci pour votre confiance ! 🙏',
  ];
  return buildWaLink(phone, lines.join('\n'));
}

/** Lien WhatsApp — changement de statut (bouton dans le modal) */
export function buildOrderStatusWhatsAppLink(order, overrideStatus = null) {
  const { phone, name } = getOrderContact(order);
  const status = overrideStatus || order.status;
  const statusText = STATUS_MESSAGES[status] || `est maintenant : ${status}`;
  const lines = [
    `Bonjour ${name} 👋`,
    '',
    `Votre commande n°${order.orderNumber} ${statusText}.`,
    '',
    `Total : ${formatPrice(order.total)}`,
    `Détails : ${CLIENT_URL}/orders/${order.orderNumber}`,
  ];
  return buildWaLink(phone, lines.join('\n'));
}