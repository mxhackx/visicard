import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ModificationForm from "@/components/order/modification-form";

export const metadata: Metadata = {
  title: "Modifier mon QR code",
  robots: { index: false, follow: false },
};

export default async function ModifierPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <ModificationForm reference={reference.toUpperCase()} />
      <Footer />
    </main>
  );
}
