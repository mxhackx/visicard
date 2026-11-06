import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import QrTypeBuilder from "@/components/qr/qr-type-builder";

export const metadata: Metadata = {
  title: "Générateur de QR code gratuit pour un lien",
  description: "Créez gratuitement un QR code pour un lien web, sans compte, en PNG et SVG.",
  alternates: { canonical: "/qr-gratuit" },
  openGraph: { url: "/qr-gratuit", title: "QR code gratuit pour un lien | Moncode" },
};

export default function QrGratuitPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <QrTypeBuilder type="url" free />
      <Footer />
    </main>
  );
}
