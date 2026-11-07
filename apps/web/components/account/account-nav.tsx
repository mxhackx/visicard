"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useFile } from "@/app/context/FileContext";
import { mySummary } from "@/lib/business";
import { BarChart3, Building2, Inbox, KeyRound, QrCode } from "lucide-react";

const TABS = [
  { href: "/compte", label: "Mes QR codes", icon: QrCode },
  { href: "/compte/performances", label: "Performances", icon: BarChart3 },
  { href: "/compte/demandes", label: "Demandes", icon: Inbox },
  { href: "/compte/etablissements", label: "Établissements", icon: Building2 },
  { href: "/compte/cles-api", label: "API", icon: KeyRound },
];

/** Navigation de l'espace client : défile horizontalement sur mobile. */
export default function AccountNav() {
  const path = usePathname();
  const box = useRef<HTMLElement>(null);
  const { authToken } = useFile();
  const [pending, setPending] = useState(0);
  // Pastille « demandes à traiter » : visible depuis tous les onglets.
  useEffect(() => {
    if (!authToken) return;
    let alive = true;
    mySummary(authToken).then((s) => alive && setPending(s.newRequests)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [authToken, path]);
  // Sur mobile, l'onglet courant est ramené dans la zone visible.
  useEffect(() => {
    box.current?.querySelector<HTMLElement>("[aria-current=page]")?.scrollIntoView({ inline: "center", block: "nearest" });
  }, [path]);
  return (
    <nav ref={box} aria-label="Espace client" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-2 border-b border-line pb-3">
        {TABS.map(({ href, label, icon: Icon }) => {
          const on = href === "/compte" ? path === "/compte" || path.startsWith("/compte/qr") : path.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link href={href} aria-current={on ? "page" : undefined} className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${on ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/75 hover:border-ink/30"}`}>
                <Icon className="h-4 w-4" /> {label}
                {href === "/compte/demandes" && pending > 0 && (
                  <span className={`ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${on ? "bg-white text-forest" : "bg-forest text-white"}`} aria-label={`${pending} à traiter`}>{pending}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
