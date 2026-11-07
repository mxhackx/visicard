import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import RequestsInbox from "@/components/account/requests-inbox";

export const metadata: Metadata = { title: "Demandes", robots: { index: false } };

export default function Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <RequestsInbox />
      <Footer />
    </main>
  );
}
