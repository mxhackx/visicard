import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Performances from "@/components/account/performances";

export const metadata: Metadata = { title: "Performances", robots: { index: false } };

export default function Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <Performances />
      <Footer />
    </main>
  );
}
