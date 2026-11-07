import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import QrManager from "@/components/account/qr-manager";

export const metadata: Metadata = { title: "Gestion du QR code", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <QrManager slug={slug} />
      <Footer />
    </main>
  );
}
