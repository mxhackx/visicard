import type { Metadata } from "next";
import Performances from "@/components/account/performances";
import AccountTopBar from "@/components/account/account-top-bar";

export const metadata: Metadata = { title: "Performances", robots: { index: false } };

export default function Page() {
  return (
    <main className="page-hero-bg min-h-screen">
      <AccountTopBar />
      <Performances />
    </main>
  );
}
