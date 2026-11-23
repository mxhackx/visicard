import type { Metadata } from "next";
import DirectQrEditor from "@/components/account/direct-qr-editor";
import AccountTopBar from "@/components/account/account-top-bar";

export const metadata: Metadata = { title: "Modifier mon QR code", robots: { index: false } };

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <main className="page-hero-bg min-h-screen">
      <AccountTopBar />
      <DirectQrEditor slug={slug} />
    </main>
  );
}
