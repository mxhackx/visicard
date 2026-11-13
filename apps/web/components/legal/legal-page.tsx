import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/header";
import Footer from "@/components/footer";

export interface LegalSection {
  title: string;
  body: ReactNode;
}

const LINKS = [
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions", label: "Conditions d’utilisation" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

/** Page juridique : titre, date de mise à jour, sommaire cliquable, sections numérotées. */
export default function LegalPage({ title, intro, updated, current, sections }: { title: string; intro: string; updated: string; current: string; sections: LegalSection[] }) {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
        <nav aria-label="Documents légaux" className="flex flex-wrap gap-2">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} aria-current={l.href === current ? "page" : undefined} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${l.href === current ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}>
              {l.label}
            </Link>
          ))}
        </nav>
        <h1 className="page-title mt-6">{title}</h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-sage">{intro}</p>
        <p className="mt-2 text-xs text-sage">Dernière mise à jour : {updated}</p>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
          <nav aria-label="Sommaire" className="hidden lg:block">
            <ol className="sticky top-24 space-y-2 text-sm">
              {sections.map((s, i) => (
                <li key={s.title}>
                  <a href={`#s${i + 1}`} className="block text-ink/70 transition-colors hover:text-forest">
                    {i + 1}. {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="max-w-3xl space-y-10">
            {sections.map((s, i) => (
              <section key={s.title} id={`s${i + 1}`} className="anchor">
                <h2 className="text-xl font-semibold tracking-[-0.01em] text-ink/90">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-3 space-y-3 text-[15px] leading-7 text-ink/80 [&_a]:font-medium [&_a]:text-forest [&_a:hover]:underline [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
