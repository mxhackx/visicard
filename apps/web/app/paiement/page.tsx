import type { Metadata } from "next";
import { Suspense } from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PaymentPage from "@/components/payment/payment-page";

export const metadata: Metadata = { title: "Paiement Premium", robots: { index: false, follow: false } };

export default function PaiementPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <Suspense>
        <PaymentPage />
      </Suspense>
      <Footer />
    </main>
  );
}
