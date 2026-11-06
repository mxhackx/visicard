"use client";

import { useRouter } from "next/navigation";
import AuthForm from "./auth-form";

export default function ConnexionClient({ next, mode }: { next: string; mode: "register" | "login" }) {
  const router = useRouter();
  return (
    <section className="mx-auto max-w-md px-4 py-14 sm:px-6 lg:py-20">
      <h1 className="text-3xl font-semibold tracking-[-0.02em] text-ink">Mon compte</h1>
      <p className="mt-2 text-sm leading-6 text-sage">
        Retrouvez vos QR codes, vos factures et modifiez vos pages en ligne.
      </p>
      <div className="surface mt-8 p-6 sm:p-8">
        <AuthForm initialMode={mode} onDone={() => router.push(next)} />
      </div>
    </section>
  );
}
