import type { Metadata } from "next";
import Establishments from "@/components/account/establishments";
import AccountTopBar from "@/components/account/account-top-bar";

export const metadata: Metadata = { title: "Établissements", robots: { index: false } };

export default function Page() {
  return (
    <main className="page-hero-bg min-h-screen">
      <AccountTopBar />
      <Establishments />
    </main>
  );
}
