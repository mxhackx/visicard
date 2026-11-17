import type { Metadata } from "next";
import QrManager from "@/components/account/qr-manager";
import AccountTopBar from "@/components/account/account-top-bar";

export const metadata: Metadata = { title: "Gestion du QR code", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="page-hero-bg min-h-screen">
      <AccountTopBar />
      <QrManager slug={slug} />
    </main>
  );
}
