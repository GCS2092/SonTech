import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-400 mt-auto border-t-2 border-rose-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-bold text-white text-lg">
                Son<span className="text-rose-400">Shop</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Vetements et accessoires en ligne. Produits authentiques, livraison rapide.
            </p>
          </div>

          <div>
            <h4 className="text-rose-400 font-semibold mb-3 text-sm uppercase tracking-wider">Boutique</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/products" className="hover:text-white transition-colors">Tous les produits</Link></li>
              <li><Link to="/cart" className="hover:text-white transition-colors">Mon panier</Link></li>
              <li><Link to="/orders" className="hover:text-white transition-colors">Mes commandes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-rose-400 font-semibold mb-3 text-sm uppercase tracking-wider">Mon compte</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/account/profile" className="hover:text-white transition-colors">Profil</Link></li>
              <li><Link to="/account/addresses" className="hover:text-white transition-colors">Adresses</Link></li>
              <li><Link to="/account/wishlist" className="hover:text-white transition-colors">Favoris</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-rose-400 font-semibold mb-3 text-sm uppercase tracking-wider">Informations</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/about" className="hover:text-white transition-colors">À propos</Link></li>
              <li><Link to="/contact" className="hover:text-white transition-colors">Nous contacter</Link></li>
              <li><Link to="/returns" className="hover:text-white transition-colors">Politique de retour</Link></li>
              <li><Link to="/cgv" className="hover:text-white transition-colors">Conditions générales de vente</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-stone-800 pt-6 text-xs text-center">
          © {new Date().getFullYear()} SonShop — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}