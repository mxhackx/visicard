import { Star } from "lucide-react";

// Textes d'exemple à remplacer par des retours réels avant la mise en ligne.
const reviews = [
  {
    quote:
      "Nous avons imprimé les QR codes sur les tables un lundi, le menu était en ligne le soir. Les clients ne demandent plus le papier.",
    name: "Awa K.",
    role: "Gérante, Le Comptoir des Halles",
    initials: "AK",
  },
  {
    quote:
      "Changer un prix ou un plat du jour prend une minute, et c'est visible immédiatement. C'est ce qui m'a convaincu.",
    name: "Yann D.",
    role: "Chef-propriétaire, Maison Braise",
    initials: "YD",
  },
  {
    quote:
      "Nos trois points de vente ont chacun leur carte, avec la même charte graphique. L'équipe a été reprise en main en un appel.",
    name: "Sarah M.",
    role: "Directrice d'enseigne, Groupe Ambre",
    initials: "SM",
  },
];

export default function Testimonials() {
  return (
    <section id="avis" className="scroll-mt-16 border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Avis</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Ce qu'en disent les établissements
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {reviews.map((review) => (
            <figure
              key={review.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6"
            >
              <div className="flex gap-0.5" aria-label="Note : 5 sur 5">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <Star key={idx} className="h-4 w-4 fill-blue-600 text-blue-600" />
                ))}
              </div>

              <blockquote className="mt-5 flex-1 text-sm leading-7 text-slate-700">
                “{review.quote}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700"
                >
                  {review.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{review.name}</p>
                  <p className="text-xs text-slate-500">{review.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
