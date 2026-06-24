import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';

export default function Contact() {
  const whatsappNumber = '221XXXXXXXXX'; // ← remplace par ton numéro

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
      <h1 className="text-3xl font-bold text-stone-800 mb-2">Nous contacter</h1>
      <p className="text-stone-400 text-sm mb-10">On vous répond en moins de 24h</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
        <a
          href={`https://wa.me/${whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-4 p-5 rounded-2xl border border-stone-200 hover:border-green-300 hover:bg-green-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-200 transition-colors">
            <MessageCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-stone-800">WhatsApp</p>
            <p className="text-sm text-stone-500 mt-0.5">Réponse rapide, 7j/7</p>
            <p className="text-sm text-green-600 mt-1 font-medium">Écrire sur WhatsApp →</p>
          </div>
        </a>

        <a
          href="mailto:sonshop221@gmail.com"
          className="flex items-start gap-4 p-5 rounded-2xl border border-stone-200 hover:border-rose-300 hover:bg-rose-50 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center flex-shrink-0 group-hover:bg-rose-200 transition-colors">
            <Mail size={20} className="text-rose-500" />
          </div>
          <div>
            <p className="font-semibold text-stone-800">Email</p>
            <p className="text-sm text-stone-500 mt-0.5">Réponse sous 24h</p>
            <p className="text-sm text-rose-500 mt-1 font-medium">sonshop221@gmail.com</p>
          </div>
        </a>

        <div className="flex items-start gap-4 p-5 rounded-2xl border border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <Phone size={20} className="text-stone-500" />
          </div>
          <div>
            <p className="font-semibold text-stone-800">Téléphone</p>
            <p className="text-sm text-stone-500 mt-0.5">Lun–Sam, 9h–18h</p>
            <p className="text-sm text-stone-700 mt-1 font-medium">+221 XX XXX XX XX</p>
          </div>
        </div>

        <div className="flex items-start gap-4 p-5 rounded-2xl border border-stone-200">
          <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-stone-500" />
          </div>
          <div>
            <p className="font-semibold text-stone-800">Adresse</p>
            <p className="text-sm text-stone-500 mt-0.5">Dakar, Sénégal</p>
            <p className="text-sm text-stone-700 mt-1">Livraison partout au Sénégal</p>
          </div>
        </div>
      </div>

      <div className="bg-stone-50 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-stone-800 mb-1">Horaires du service client</h2>
        <p className="text-stone-500 text-sm mb-4">WhatsApp disponible 7j/7, téléphone en semaine.</p>
        <div className="space-y-2 text-sm">
          {[
            ['Lundi – Vendredi', '9h00 – 18h00'],
            ['Samedi',           '9h00 – 14h00'],
            ['Dimanche',         'WhatsApp uniquement'],
          ].map(([day, hours]) => (
            <div key={day} className="flex justify-between">
              <span className="text-stone-600">{day}</span>
              <span className="text-stone-800 font-medium">{hours}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
