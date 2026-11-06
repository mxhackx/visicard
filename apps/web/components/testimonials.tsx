import { Quote } from "lucide-react";
import SectionHeading from "@/components/section-heading";
// Mots des fondateurs : à faire relire et valider par les intéressés avant la mise en ligne.
const reviews = [
  {
    quote:
      "Nous voulons qu’un commerçant puisse mettre son menu, ses horaires ou son catalogue derrière un QR code en quelques minutes, sans compétence technique et à un prix qu’il comprend.",
    name: "Carmel TINHOUINTIN",
    role: "PDG, Moncode",
    initials: "CT",
  },
  {
    quote:
      "Un QR code imprimé ne doit jamais devenir inutile : le contenu évolue, le code reste. C’est la promesse que nous tenons à chaque commande, avec une équipe joignable sur WhatsApp.",
    name: "Mateo GRAND",
    role: "PDG, Moncode",
    initials: "MG",
  },
];

export default function Testimonials() {
  return (
    <section id="avis" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Un mot des fondateurs"
          subtitle="Pourquoi nous avons créé Moncode, et ce que nous vous promettons."
        />

        <div className="mx-auto mt-14 grid max-w-4xl gap-5 md:grid-cols-2">
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
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf text-xs font-semibold tracking-wide text-ambre-deep"
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
