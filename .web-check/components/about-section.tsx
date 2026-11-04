import Link from "next/link";
import { ArrowRight } from "lucide-react";

const principles = [
  {
    title: "Le numérique ne doit pas compliquer le service",
    text: "Une carte se met à jour entre deux services, pas après une formation de trois jours.",
  },
  {
    title: "Un prix annoncé est un prix tenu",
    text: "Vingt mille FCFA, une fois. Pas de commission cachée sur ce que vous vendez.",
  },
  {
    title: "Un humain répond",
    text: "Vous écrivez sur WhatsApp, une personne de l'équipe vous répond et, si besoin, fait la mise à jour avec vous.",
  },
];

export default function AboutSection() {
  return (
    <section id="a-propos" className="scroll-mt-16 border-b border-slate-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-semibold text-blue-600">À propos</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Nous digitalisons la carte, pas votre métier
          </h2>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Moncode est né d'un constat simple : les établissements que nous équipons n'ont ni le
            temps ni l'envie de gérer un site web. Ils ont besoin d'une carte lisible, modifiable en
            deux minutes, et d'un QR code qui ne casse jamais.
          </p>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Nous prenons en charge la mise en ligne, l'impression des codes et la reprise en main de
            votre équipe. Le reste — vos plats, vos prix, votre style — vous appartient.
          </p>

          <Link
            href="/about"
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Notre approche en détail
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-slate-50 px-6 sm:px-8">
          {principles.map((principle) => (
            <li key={principle.title} className="py-6 first:pt-8 last:pb-8">
              <h3 className="text-base font-semibold text-slate-900">{principle.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{principle.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
