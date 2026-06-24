import { RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function Returns() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Politique de retour</h1>
      <p className="text-stone-400 text-sm mb-10">Vos achats sont protégés chez SonShop</p>

      {/* Résumé visuel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        {[
          { icon: Clock, color: 'bg-amber-100 text-amber-600', title: '3 jours', sub: 'pour signaler un problème' },
          { icon: RefreshCw, color: 'bg-blue-100 text-blue-600', title: 'Échange', sub: 'ou remboursement au choix' },
          { icon: CheckCircle, color: 'bg-green-100 text-green-600', title: 'Simple', sub: 'via WhatsApp ou email' },
        ].map(({ icon: Icon, color, title, sub }) => (
          <div key={title} className="flex flex-col items-center text-center p-5 rounded-2xl border border-stone-200">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-3`}>
              <Icon size={22} />
            </div>
            <p className="font-bold text-stone-800 text-lg">{title}</p>
            <p className="text-sm text-stone-500 mt-1">{sub}</p>
          </div>
        ))}
      </div>

      <div className="space-y-8 text-stone-600 leading-relaxed">

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Comment initier un retour ?</h2>
          <ol className="space-y-3">
            {[
              'Contactez-nous dans les 3 jours suivant la réception via WhatsApp ou email.',
              'Indiquez votre numéro de commande et joignez des photos du produit.',
              'Notre équipe valide votre demande et vous indique la marche à suivre.',
              'Renvoyez le produit dans son emballage d\'origine (non utilisé, non lavé).',
              'Remboursement ou échange traité sous 5 à 3 jours ouvrés.',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Produits éligibles au retour</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl border border-green-200 bg-green-50">
              <p className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle size={16} /> Acceptés
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Produit défectueux à la réception</li>
                <li>• Produit non conforme à la description</li>
                <li>• Mauvaise taille reçue (erreur de notre part)</li>
                <li>• Produit endommagé pendant la livraison</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <XCircle size={16} /> Non acceptés
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• Produit utilisé ou lavé</li>
                <li>• Produit sans emballage d'origine</li>
                <li>• Signalement après 3 jours</li>
                <li>• Changement d'avis simple</li>
              </ul>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-stone-800 mb-3">Remboursement</h2>
          <p>
            Le remboursement est effectué via le même mode de paiement utilisé lors de l'achat
            (Mobile Money ou espèces selon le cas), dans un délai de 1 à 3 jours ouvrés après
            réception et vérification du produit retourné.
          </p>
        </div>

        <div className="bg-rose-50 rounded-2xl p-5 border border-rose-100">
          <p className="font-semibold text-stone-800 mb-1">Une question ?</p>
          <p className="text-sm text-stone-600">
            Notre équipe est disponible sur{' '}
            <a href="/contact" className="text-rose-500 hover:underline font-medium">
              WhatsApp et par email
            </a>{' '}
            pour vous accompagner dans votre demande de retour.
          </p>
        </div>
      </div>
    </div>
  );
}
