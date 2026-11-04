import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import CreateFlow from "@/components/create-flow";
import { isServiceType } from "@/lib/services";

export const metadata: Metadata = {
  title: "Créer un QR code — Moncode",
  description:
    "Créez un QR code pour une page digitale, une image/vidéo ou un document PDF avec Moncode.",
};

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
