export function formatPrice(amount) {
  if (amount == null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDiscount(type, value) {
  if (type === 'PERCENTAGE') return `-${value}%`;
  return `-${formatPrice(value)}`;
}
