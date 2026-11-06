import type { Metadata } from "next";
import Header from "@/components/header";
import Footer from "@/components/footer";
import ConnexionClient from "@/components/account/connexion-client";
import { safeNext } from "@/lib/account";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false },
};

export default async function ConnexionPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[]; mode?: string | string[] }>;
}) {
  const params = await searchParams;
  const next = safeNext(Array.isArray(params.next) ? params.next[0] : params.next);
  const mode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) === "register" ? "register" : "login";
  return (
    <main className="min-h-screen">
      <Header />
      <div className="header-spacer"></div>
      <ConnexionClient next={next} mode={mode} />
      <Footer />
    </main>
  );
}
