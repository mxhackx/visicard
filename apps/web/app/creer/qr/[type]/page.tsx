import { pageMetadata } from "@/lib/seo";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Header from "@/components/header";
import Footer from "@/components/footer";
import QrTypeBuilder from "@/components/qr/qr-type-builder";
import { DIRECT_QR_TYPES, type DirectQrType } from "@/lib/qr-payloads";

const PAID = DIRECT_QR_TYPES.filter((t) => t.id !== "url");

export function generateStaticParams() {
  return PAID.map((t) => ({ type: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  const meta = DIRECT_QR_TYPES.find((t) => t.id === type);
  return pageMetadata({
    title: meta ? `QR code ${meta.label}` : "QR code",
    description: meta ? `Créez un QR code ${meta.label} : ${meta.hint.toLowerCase()}. Aperçu en direct sur téléphone, iPad et Mac, téléchargement PNG et SVG.` : "Créez votre QR code Moncode.",
    path: `/creer/qr/${type}`,
  });
}

export default async function QrTypePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  // Le lien web est gratuit : il a sa propre page.
  if (type === "url") redirect("/qr-gratuit");
  if (!PAID.some((t) => t.id === type)) notFound();

  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <QrTypeBuilder type={type as DirectQrType} />
      <Footer />
    </main>
  );
}
