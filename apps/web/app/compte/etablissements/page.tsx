import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Establishments from "@/components/account/establishments";

export const metadata: Metadata = { title: "Établissements", robots: { index: false } };

export default function Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <Establishments />
      <Footer />
    </main>
  );
}
