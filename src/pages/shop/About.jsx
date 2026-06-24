export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">À propos de SonShop</h1>
      <p className="text-stone-400 text-sm mb-10">Notre histoire, nos valeurs</p>

      <div className="space-y-8 text-stone-600 leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Qui sommes-nous ?</h2>
          <p>
            SonShop est une boutique en ligne spécialisée dans les vêtements et accessoires
            authentiques, fondée au Sénégal avec une vision simple : rendre la mode de qualité
            accessible à tous, avec une livraison rapide partout au Sénégal et à l'international.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Nos valeurs</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span><strong className="text-stone-700">Qualité</strong> — Chaque produit est sélectionné avec soin avant d'être proposé.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span><strong className="text-stone-700">Transparence</strong> — Prix clairs, descriptions honnêtes, aucune mauvaise surprise.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-rose-400 flex-shrink-0" />
              <span><strong className="text-stone-700">Proximité</strong> — Nous sommes joignables rapidement via WhatsApp pour toute question.</span>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Livraison</h2>
          <p>
            Nous livrons partout au Sénégal. Des partenariats avec des transporteurs fiables
            nous permettent d'assurer une livraison rapide et sécurisée. Nous exportons également
            à l'international sur demande.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Nous contacter</h2>
          <p>
            Une question ? Un problème ? Notre équipe répond dans les 24h via WhatsApp ou email.
            Consultez notre <a href="/contact" className="text-rose-500 hover:underline">page contact</a> pour
            tous nos moyens de communication.
          </p>
        </div>
      </div>
    </div>
  );
}
