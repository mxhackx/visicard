import type { Metadata } from "next";
import PremiumInvoice from "@/components/order/premium-invoice";

export const metadata: Metadata = { title: "Facture Premium", robots: { index: false, follow: false } };

export default async function FacturePremiumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen print:bg-white">
      <PremiumInvoice id={id} />
    </main>
  );
}
