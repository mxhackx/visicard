"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BarChart3, Building2, Inbox, QrCode } from "lucide-react";
import { useFile } from "@/app/context/FileContext";
import { mySummary, type Summary } from "@/lib/business";

/** Haut de « Mon espace » : ce qui demande une action (demandes) puis l'essentiel en un coup d'œil. */
export default function Overview() {
  const { authToken } = useFile();
  const [s, setS] = useState<Summary | null>(null);

  useEffect(() => {
    if (!authToken) return;
    let alive = true;
    mySummary(authToken).then((r) => alive && setS(r)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [authToken]);

  if (!s || s.cards === 0) return null;

  return (
    <div className="mt-6 space-y-3">
      {s.newRequests > 0 && (
        <Link href="/compte/demandes" className="flex items-center justify-between gap-3 rounded-2xl bg-forest px-4 py-3.5 text-white shadow-md transition hover:bg-forest-dark">
          <span className="flex items-center gap-2.5 text-sm font-semibold">
            <Inbox className="h-5 w-5" /> {s.newRequests} demande{s.newRequests > 1 ? "s" : ""} à traiter
          </span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
      <div className="grid grid-cols-3 gap-3">
        {([
          [QrCode, s.cards, "QR codes en ligne", "/compte/performances"],
          [BarChart3, s.scans7, "scans en 7 jours", "/compte/performances"],
          [Building2, s.establishments, "établissements", "/compte/etablissements"],
        ] as const).map(([Icon, v, l, href]) => (
          <Link key={l} href={href} className="surface surface-hover p-3 text-center sm:p-4">
            <Icon className="mx-auto h-4 w-4 text-sage" />
            <p className="mt-1 text-xl font-semibold text-ink sm:text-2xl">{new Intl.NumberFormat("fr-FR").format(v)}</p>
            <p className="text-xs text-sage">{l}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
