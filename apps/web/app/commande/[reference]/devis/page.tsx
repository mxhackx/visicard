import type { Metadata } from "next";
import OrderDocument from "@/components/order/order-document";

export const metadata: Metadata = {
  title: "Devis",
  robots: { index: false, follow: false },
};

export default async function DevisPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  return (
    <main className="min-h-screen print:bg-white">
      <OrderDocument reference={reference.toUpperCase()} kind="devis" />
    </main>
  );
}
