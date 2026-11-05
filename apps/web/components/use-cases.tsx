import { Briefcase, Flower2, Scissors, Store, UtensilsCrossed, Stethoscope } from "lucide-react";

// Section prête à monter dans app/page.tsx si vous voulez cibler des secteurs
// précis. Elle n'est pas affichée sur la landing pour l'instant.
const cases = [
  {
    icon: UtensilsCrossed,
    title: "Restaurants & bistros",
    text: "Carte, plats du jour et horaires mis à jour en direct, sans réimprimer quoi que ce soit.",
  },
  {
    icon: Store,
    title: "Boutiques & épiceries",
    text: "Une vitrine de vos produits et promotions, accessible d'un scan au comptoir.",
  },
  {
    icon: Scissors,
    title: "Salons & barbiers",
    text: "Tarifs, prestations et prise de rendez-vous regroupés sur une seule page lisible.",
  },
  {
    icon: Stethoscope,
    title: "Cabinets & cliniques",
    text: "Actes, tarifs et informations pratiques partagés en accueil, sans application à installer.",
  },
  {
    icon: Flower2,
    title: "Traiteurs & événementiel",
    text: "Une carte par événement, publiée et retirée quand vous le décidez.",
  },
  {
    icon: Briefcase,
    title: "Hôtels & espaces",
    text: "Services, restaurant, spa et infos séjour réunis sous un QR code dans la chambre.",
  },
];

export default function UseCases() {
  return (
    <section id="cas-dusage" className="anchor border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Cas d’usage</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Pensé pour les établissements qui reçoivent
          </h2>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cases.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
