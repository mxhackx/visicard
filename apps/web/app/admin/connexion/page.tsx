import type { Metadata } from "next";
import ConnexionForm from "@/components/connexion-form";

export const metadata: Metadata = {
  title: "Connexion administrateur — Moncode",
  robots: { index: false, follow: false },
};

export default async function AdminConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const params = await searchParams;
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;
  const next = rawNext && rawNext.startsWith("/admin") ? rawNext : "/admin";
  return <ConnexionForm next={next} />;
}
