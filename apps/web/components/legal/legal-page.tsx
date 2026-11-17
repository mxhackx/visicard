import type { ReactNode } from "react";
import Link from "next/link";
import { CalendarClock } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import LegalNav from "./legal-nav";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

const LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d’utilisation" },
];

/** Page juridique, sur le gabarit du manuel : sommaire fixe à gauche (pastilles sur mobile),
    en-tête avec document actif, sections numérotées en cartes. */
export default function LegalPage({ title, intro, updated, current, sections }: { title: string; intro: string; updated: string; current: string; sections: LegalSection[] }) {
  return (
    <main className="page-hero-bg min-h-screen">
      <Header />
      <div className="header-spacer"></div>

      <div className="flex w-full flex-col lg:flex-row">
        <LegalNav items={sections.map((s, i) => [`s${i + 1}`, s.title] as const)} />

        <section className="min-w-0 flex-1 px-4 pb-16 pt-8 sm:px-6 lg:px-10 lg:pt-12">
          {/* Les deux documents, en pastilles : le document en cours est plein. */}
          <nav aria-label="Documents légaux" className="flex flex-wrap gap-2">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-current={l.href === current ? "page" : undefined}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${l.href === current ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75 hover:border-forest hover:text-forest"}`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <h1 className="page-title mt-5">{title}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-sage">{intro}</p>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-sage">
            <CalendarClock className="h-4 w-4 text-forest" /> Dernière mise à jour : {updated}
          </p>

          <div className="mt-8 min-w-0 max-w-3xl space-y-6">
            {sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="surface anchor space-y-4 p-6 text-[15px] leading-7 text-ink/80 sm:p-8">
                <div className="flex items-center gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf text-sm font-bold text-ambre-deep">{String(i + 1).padStart(2, "0")}</span>
                  <h2 className="text-2xl font-semibold tracking-[-0.02em] text-ink">{s.title}</h2>
                </div>
                <div className="space-y-3 [&_a]:font-medium [&_a]:text-forest [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
              </section>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}
