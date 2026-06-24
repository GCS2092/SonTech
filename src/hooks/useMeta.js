import { useEffect } from 'react';

const DEFAULT_META = {
  title: 'SonShop — Vêtements & accessoires authentiques',
  description:
    'Découvrez SonShop, votre boutique en ligne de vêtements et accessoires de qualité. Livraison rapide partout au Sénégal et à l\'international.',
  image: 'https://urban-beauty.vercel.app/icons/icon-512x512.png',
  url: 'https://urban-beauty.vercel.app',
};

/**
 * Hook pour gérer les balises meta SEO et Open Graph
 * Usage : useMeta({ title: 'Mon produit', description: '...', image: '...' })
 */
export function useMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const t = title ? `${title} — SonShop` : DEFAULT_META.title;
    const d = description || DEFAULT_META.description;
    const img = image || DEFAULT_META.image;
    const u = url || window.location.href;

    // Title
    document.title = t;

    // Helpers
    const setMeta = (selector, content) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        const attr = selector.includes('property') ? 'property' : 'name';
        const val = selector.match(/["']([^"']+)["']/)?.[1];
        if (attr && val) el.setAttribute(attr, val);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // Standard
    setMeta('meta[name="description"]', d);

    // Open Graph (Facebook, WhatsApp, LinkedIn)
    setMeta('meta[property="og:title"]', t);
    setMeta('meta[property="og:description"]', d);
    setMeta('meta[property="og:image"]', img);
    setMeta('meta[property="og:url"]', u);
    setMeta('meta[property="og:type"]', 'website');
    setMeta('meta[property="og:site_name"]', 'SonShop');
    setMeta('meta[property="og:locale"]', 'fr_FR');

    // Twitter Card
    setMeta('meta[name="twitter:card"]', 'summary_large_image');
    setMeta('meta[name="twitter:title"]', t);
    setMeta('meta[name="twitter:description"]', d);
    setMeta('meta[name="twitter:image"]', img);
  }, [title, description, image, url]);
}
