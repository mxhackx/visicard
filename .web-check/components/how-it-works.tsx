import { QrCode, Smartphone, UtensilsCrossed } from "lucide-react";

const ownerSteps = [
  {
    title: "Vous créez votre carte",
    text: "Nom, plats, prix, photos, horaires : vous remplissez un formulaire, sans écrire une ligne de code.",
  },
  {
    title: "Vous générez votre QR code",
    text: "Un QR code unique est attribué à votre établissement, prêt à télécharger et à imprimer.",
  },
  {
    title: "Vous publiez et vous ajustez",
    text: "Chaque modification est en ligne immédiatement. Le QR code, lui, ne change jamais.",
  },
];

const guestSteps = [
  {
    title: "Il scanne",
    text: "L'appareil photo du téléphone suffit. Aucune application à installer.",
  },
  {
    title: "Il consulte, puis vous appelle",
    text: "La carte s'affiche à jour, avec le bouton WhatsApp pour commander ou réserver.",
  },
];

export default function HowItWorks() {
  return (
    <section id="fonctionnement" className="scroll-mt-16 border-b border-slate-100 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-blue-600">Comment ça marche</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Deux côtés, un seul scan
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600">
            Moncode se pense comme un aller-retour très court : vous préparez votre carte une fois,
            vos clients la consultent à chaque visite.
          </p>
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <Track
            label="Côté établissement"
            meta="Environ 20 minutes, une seule fois"
            icon={UtensilsCrossed}
            items={ownerSteps}
          />

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
            <Track
              label="Côté client"
              meta="Instantané, à table"
              icon={Smartphone}
              items={guestSteps}
              compact
            />
            <div className="mt-7 flex items-start gap-3 border-t border-slate-200 pt-6">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              <p className="text-sm leading-6 text-slate-600">
                Un QR code par table, par comptoir ou par vitrine : vous savez d'où viennent vos
                scans.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Track({
  label,
  meta,
  icon: Icon,
  items,
  compact = false,
}: {
  label: string;
  meta: string;
  icon: typeof UtensilsCrossed;
  items: { title: string; text: string }[];
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900">
          <Icon className="h-4 w-4 text-blue-600" />
          {label}
        </h3>
        <p className="text-xs text-slate-500">{meta}</p>
      </div>

      <ol className="mt-6 space-y-6">
        {items.map((item, idx) => (
          <li key={item.title} className="flex gap-4">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-blue-200 bg-white text-xs font-semibold text-blue-700">
              {idx + 1}
            </span>
            <div>
              <h4 className="text-base font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <p className="mt-6 border-l-2 border-blue-200 pl-4 text-sm leading-6 text-slate-600">
          Rien à installer sur place : tout se pilote depuis votre compte en ligne.
        </p>
      )}
    </div>
  );
}
