import Image from "next/image";
import SectionHeading from "@/components/section-heading";
import { Layers, QrCode, Smartphone, UploadCloud } from "lucide-react";

const ownerSteps = [
  {
    title: "Vous choisissez le service",
    text: "Page digitale, image / vidéo ou document PDF. Chaque service correspond à un seul QR code.",
  },
  {
    title: "Vous envoyez le contenu",
    text: "Vous remplissez la page ou déposez le fichier. Tout se fait depuis votre compte, sans compétence technique.",
  },
  {
    title: "Vous recevez le QR code",
    text: "Le code est généré immédiatement, téléchargeable et prêt à imprimer. Le contenu peut évoluer ensuite.",
  },
];

const guestSteps = [
  {
    title: "Il scanne",
    text: "L'appareil photo du téléphone suffit. Aucune application à installer.",
  },
  {
    title: "Il consulte",
    text: "La page, l'image, la vidéo ou le PDF s'ouvre immédiatement, avec le contact à portée de main.",
  },
];

export default function HowItWorks() {
  return (
    <section id="fonctionnement" className="anchor">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <SectionHeading
          title="Trois étapes, un seul scan"
          subtitle="Vous préparez le contenu une fois, vos clients le consultent à chaque scan."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <div data-reveal>
            <Track
              label="Côté client Moncode"
              meta="En quelques minutes, une seule fois"
              icon={Layers}
              items={ownerSteps}
            />
          </div>

          <div className="surface overflow-hidden" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
            {/* Illustration unDraw (licence libre), stockée dans public/illustrations. */}
            <div className="relative aspect-[16/9] bg-cream-deep">
              <Image
                src="/illustrations/scan-qr.svg"
                alt="Un téléphone scanne un QR code"
                fill
                unoptimized
                sizes="(max-width: 1024px) 100vw, 440px"
                className="object-contain p-6"
              />
            </div>
            <div className="p-6 sm:p-8">
            <Track
              label="Côté visiteur"
              meta="Instantané, au premier scan"
              icon={Smartphone}
              items={guestSteps}
              compact
            />
            <div className="mt-7 flex items-start gap-3 border-t border-line pt-6">
              <QrCode className="mt-0.5 h-4 w-4 shrink-0 text-forest" />
              <p className="text-[15px] leading-7 text-sage">
                Un QR code par contenu. Pour plusieurs codes ou plusieurs points de vente, le
                sur-mesure est chiffré séparément.
              </p>
            </div>
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
  icon: typeof Layers;
  items: { title: string; text: string }[];
  compact?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-4">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-ink">
          <Icon className="h-4 w-4 text-forest" />
          {label}
        </h3>
        <p className="text-xs text-sage">{meta}</p>
      </div>

      <ol className="mt-7 space-y-7">
        {items.map((item, idx) => (
          <li key={item.title} className="flex gap-5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-leaf text-sm font-semibold text-ambre-deep">
              {String(idx + 1).padStart(2, "0")}
            </span>
            <div>
              <h4 className="text-base font-semibold text-ink">{item.title}</h4>
              <p className="mt-1.5 text-[15px] leading-7 text-sage">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>

      {!compact && (
        <p className="mt-7 border-l-2 border-ambre/60 pl-4 text-[15px] leading-7 text-sage">
          <UploadCloud className="mb-1 inline h-4 w-4 text-ink" /> Vos fichiers restent accessibles
          depuis votre espace client, avec leur QR code.
        </p>
      )}
    </div>
  );
}
