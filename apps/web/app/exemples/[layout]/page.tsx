import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ExamplePage from "@/components/example-page";
import { EXAMPLE_IDS } from "@/lib/examples";
import { LAYOUT_OPTIONS } from "@/lib/layouts";
import type { LayoutId } from "@/lib/palette";

export function generateStaticParams() {
  return EXAMPLE_IDS.map((layout) => ({ layout }));
}

export async function generateMetadata({ params }: { params: Promise<{ layout: string }> }): Promise<Metadata> {
  const { layout } = await params;
  const option = LAYOUT_OPTIONS.find((o) => o.id === layout);
  return { title: option ? `Exemple de page ${option.name}` : "Exemple de page" };
}

export default async function ExampleRoute({ params }: { params: Promise<{ layout: string }> }) {
  const { layout } = await params;
  if (!EXAMPLE_IDS.includes(layout as LayoutId)) notFound();
  const option = LAYOUT_OPTIONS.find((o) => o.id === layout)!;

  return (
    <main>
      <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-ink px-4 py-2.5 text-sm text-white">
        <span className="truncate">Exemple · style {option.name} · contenu fictif</span>
        <span className="flex shrink-0 gap-2">
          <Link href="/#exemples" className="rounded-full px-3 py-1 text-white/80 hover:text-white">Retour</Link>
          <Link href="/creer?service=page" className="rounded-full bg-white px-3 py-1 font-semibold text-ink">Créer ma page</Link>
        </span>
      </div>
      <ExamplePage layout={option.id} />
    </main>
  );
}
