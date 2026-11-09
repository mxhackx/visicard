import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import HeroDashboard from "@/components/hero-dashboard";

const POINTS = [
  "Wi-Fi, carte de visite, menu, PDF : un QR pour chaque besoin",
  "Une page digitale prête pour votre métier",
  "Modifiable à tout moment, sans réimprimer",
];

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--header-h)+1px)] bg-[radial-gradient(60%_55%_at_78%_28%,rgba(227,5,29,0.07),transparent_70%),linear-gradient(#fff,#fbf5f5)] text-ink">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-8 lg:py-16">
        <div data-reveal>
          <h1 className="max-w-xl text-[2.5rem] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.6rem]">
            Créez votre QR code <span className="text-forest">en quelques minutes</span>
          </h1>

          <ul className="mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[17px] leading-7 text-ink/80">
                <Check className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={2.5} /> {p}
              </li>
            ))}
          </ul>

          <div className="mt-9 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
            <Link href="/qr-gratuit" className="btn btn-outline px-6 py-4 text-base">
              Créer un QR code gratuit
            </Link>
            <Link href="/creer" className="btn btn-primary px-8 py-4 text-base">
              Créer un QR code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-sage">
            <span className="h-1.5 w-1.5 rounded-full bg-forest" /> Sans abonnement · paiement en ligne sécurisé
          </p>
        </div>

        <div data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          <HeroDashboard />
        </div>
      </div>

    </section>
  );
}
