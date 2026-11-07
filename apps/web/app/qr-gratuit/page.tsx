import type { Metadata } from "next";
import JsonLd from "@/components/json-ld";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { pageMetadata, breadcrumbJsonLd } from "@/lib/seo";
import QrTypeBuilder from "@/components/qr/qr-type-builder";

export const metadata: Metadata = pageMetadata({
  title: "Générateur de QR code gratuit pour un lien",
  description: "Créez gratuitement un QR code pour un lien web, sans compte : choisissez les couleurs et les formes, téléchargez en PNG et SVG.",
  path: "/qr-gratuit",
});

export default function QrGratuitPage() {
  return (
    <main className="min-h-screen">
      <JsonLd data={breadcrumbJsonLd([["Accueil", "/"], ["QR code gratuit", "/qr-gratuit"]])} />
      <Header />
      <div className="header-spacer"></div>
      <QrTypeBuilder type="url" free />
      <Footer />
    </main>
  );
}
