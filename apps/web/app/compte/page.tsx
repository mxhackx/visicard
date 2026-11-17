import type { Metadata } from "next";
import { Suspense } from "react";
import AccountSpace from "@/components/account/account-space";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };

export default function ComptePage() {
  return (
    <main className="page-hero-bg min-h-screen">
      <Suspense>
        <AccountSpace />
      </Suspense>
    </main>
  );
}
