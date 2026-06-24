import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date) {
  if (!date) return '';
  return format(new Date(date), 'dd MMM yyyy', { locale: fr });
}

export function formatDateTime(date) {
  if (!date) return '';
  return format(new Date(date), 'dd MMM yyyy à HH:mm', { locale: fr });
}

export function formatRelative(date) {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}
