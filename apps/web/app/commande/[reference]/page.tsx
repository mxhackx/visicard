import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import OrderView from "@/components/order/order-view";

export const metadata: Metadata = {
  title: "Votre commande — Moncode",
  robots: { index: false, follow: false },
};

export default async function CommandePage({
  params,
  searchParams,
}: {
  params: Promise<{ reference: string }>;
  searchParams: Promise<{ cle?: string | string[]; paiement?: string | string[] }>;
}) {
  const { reference } = await params;
  const query = await searchParams;
  const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <OrderView reference={reference.toUpperCase()} keyFromUrl={one(query.cle)} returningFrom={one(query.paiement)} />
      <Footer />
    </main>
  );
}
