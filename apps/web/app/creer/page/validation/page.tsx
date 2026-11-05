import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import PageCheckout from "@/components/order/page-checkout";

export const metadata: Metadata = { title: "Votre page digitale : devis" };

export default function CreerPageValidation() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <PageCheckout />
      <Footer />
    </main>
  );
}
