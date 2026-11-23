import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import HeroDashboard from "@/components/hero-dashboard";

const POINTS = [
  "Wi-Fi, carte de visite, menu, PDF : un QR pour chaque besoin",
  "Une page digitale prête pour votre activité",
  "Modifiable à tout moment, sans réimprimer",
];

export default function Hero({
  lines = ["Créez votre QR code", "en quelques secondes"],
  points = POINTS,
  cta = { href: "/creer", label: "Créer mon QR code" },
  as: Title = "h1",
}: {
  lines?: [string, string];
  points?: readonly string[];
  cta?: { href: string; label: string };
  as?: "h1" | "h2";
} = {}) {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden pt-[calc(var(--header-h)+1px)] text-ink">
      <div className="relative mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-10 lg:px-8 lg:py-16">
        <div data-reveal className="hero-copy">
          <Title className="text-[clamp(1.7rem,8.6vw,2.5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-ink sm:text-5xl lg:text-[3.1rem] xl:text-[3.4rem]">
            <span className="block whitespace-nowrap">{lines[0]}</span>{" "}
            <span className="block whitespace-nowrap text-forest">{lines[1]}</span>
          </Title>

          <ul className="mt-7 space-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3 text-[17px] leading-7 text-ink/80">
                <Check className="mt-1 h-5 w-5 shrink-0 text-forest" strokeWidth={2.5} /> {p}
              </li>
            ))}
          </ul>

          <div className="mt-9">
            <Link href={cta.href} className="btn btn-primary w-full px-12 py-[1.15rem] text-lg sm:max-w-[34rem]">
              {cta.label} <ArrowRight className="h-4 w-4" />
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
