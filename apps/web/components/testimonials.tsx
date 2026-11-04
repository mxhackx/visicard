import { Quote } from "lucide-react";
import SectionHeading from "@/components/section-heading";
// Textes d'exemple à remplacer par des retours réels avant la mise en ligne.
const reviews = [
  {
    quote:
      "Nous avons remplacé la carte papier par une page digitale : un seul QR code sur les tables, et les prix changent sans réimpression.",
    name: "Awa K.",
    role: "Gérante, Le Comptoir des Halles",
    initials: "AK",
  },
  {
    quote:
      "Une vidéo de présentation derrière un QR code sur nos flyers : les clients la regardent avant même de pousser la porte.",
    name: "Yann D.",
    role: "Fondateur, Maison Braise",
    initials: "YD",
  },
  {
    quote:
      "Le catalogue PDF est accessible en un scan. Nos commerciaux n’impriment plus des dizaines de brochures à chaque salon.",
    name: "Sarah M.",
    role: "Directrice, Groupe Ambre",
    initials: "SM",
  },
];

export default function Testimonials() {
  return (
    <section id="avis" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Ce qu’en disent les établissements"
          subtitle="Quelques retours de clients Moncode."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {reviews.map((review, idx) => (
            <figure
              key={review.name}
              className="surface flex flex-col p-6 sm:p-7"
              data-reveal
              style={{ "--d": `${idx * 80}ms` } as React.CSSProperties}
            >
              <span aria-hidden="true" className="icon-tile">
                <Quote className="h-5 w-5" />
              </span>

              <blockquote className="mt-3 flex-1 text-base leading-7 text-ink/75">
                {review.quote}
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-line pt-5">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf text-xs font-semibold tracking-wide text-forest"
                >
                  {review.initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{review.name}</p>
                  <p className="text-xs text-sage">{review.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
