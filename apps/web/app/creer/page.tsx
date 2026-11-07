import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CreateFlow from "@/components/create-flow";
import { pageMetadata } from "@/lib/seo";
import { isServiceType } from "@/lib/services";

export const metadata: Metadata = pageMetadata({
  title: "Créer un QR code : menu digital, page, image, vidéo ou PDF",
  description: "Choisissez votre service, préparez le contenu et payez en ligne par Mobile Money ou carte. Page digitale 20 000 FCFA, image, vidéo ou PDF 5 000 FCFA.",
  path: "/creer",
});

export default async function CreerPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.service) ? params.service[0] : params.service;
  const initialService = isServiceType(raw) ? raw : null;

  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <CreateFlow initialService={initialService} />
      <Footer />
    </main>
  );
}
