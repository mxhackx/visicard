import type { Metadata } from "next";
import RequestsInbox from "@/components/account/requests-inbox";
import AccountTopBar from "@/components/account/account-top-bar";

export const metadata: Metadata = { title: "Demandes", robots: { index: false } };

export default function Page() {
  return (
    <main className="page-hero-bg min-h-screen">
      <AccountTopBar />
      <RequestsInbox />
    </main>
  );
}
