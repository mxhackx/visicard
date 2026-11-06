import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ApiKeys from "@/components/account/api-keys";

export const metadata: Metadata = { title: "Clés d’API", robots: { index: false } };

export default function ClesApiPage() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <ApiKeys />
      <Footer />
    </main>
  );
}
