import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import AccountOrders from "@/components/account/account-orders";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default function ComptePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <AccountOrders />
      <Footer />
    </main>
  );
}
