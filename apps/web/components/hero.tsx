import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import HeroDashboard from "@/components/hero-dashboard";

const POINTS = [
  "Wi-Fi, carte de visite, menu, PDF : un QR pour chaque besoin",
  "Une page digitale prête pour votre activité",
  "Modifiable à tout moment, sans réimprimer",
];

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--header-h)+1px)] bg-[radial-gradient(60%_55%_at_78%_28%,rgba(227,5,29,0.07),transparent_70%),linear-gradient(#fff,#fbf5f5)] text-ink">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-8 lg:py-16">
        <div data-reveal className="hero-copy">
          <h1 className="text-[2.2rem] font-bold leading-[1.08] tracking-[-0.03em] text-ink min-[400px]:text-[2.5rem] sm:text-5xl lg:text-[3.1rem] xl:text-[3.4rem]">
            <span className="block whitespace-nowrap">Créez votre QR code</span>
            <span className="block whitespace-nowrap text-forest">en quelques secondes</span>
          </h1>

          <ul className="mt-7 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[17px] leading-7 text-ink/80">
                <Check className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={2.5} /> {p}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Link href="/creer" className="btn btn-primary w-full px-12 py-[1.15rem] text-lg sm:max-w-[34rem]">
              Créer mon QR code <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Sur téléphone, le hero tient dans un seul écran : la maquette arrive à partir de la taille tablette. */}
        <div className="hidden sm:block" data-reveal style={{ "--d": "120ms" } as React.CSSProperties}>
          <HeroDashboard />
        </div>
      </div>

    </section>
  );
}
