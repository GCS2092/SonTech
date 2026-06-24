import { API_URL } from './constants';

/**
 * Retourne l'URL complète d'une image.
 * Si l'URL est déjà absolue (http/https), elle est retournée telle quelle.
 * Sinon, on préfixe avec API_URL.
 */
export function getImageUrl(url) {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Retourne l'image principale d'un produit (avec URL complète).
 */
export function getMainImage(images = []) {
  const img = images.find((i) => i.isMain) || images[0];
  if (!img) return null;
  return { ...img, url: getImageUrl(img.url) };
}