"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DirectQrGenerator from "@/components/qr/direct-qr-generator";
import AdminShell from "./AdminShell";

/** Le générateur gratuit, dans le cadre de l'administration. */
export default function AdminDirectQr() {
  return (
    <AdminShell active="new" title="QR code simple" hint="Gratuit, aussi disponible pour les clients sur /qr-gratuit">
      {() => (
        <div className="mx-auto max-w-5xl">
          <Link href="/admin/nouveau" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Choix du parcours
          </Link>
          <div className="mt-6">
            <DirectQrGenerator paidHref="/admin/nouveau" />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
