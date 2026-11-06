"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DirectQrGenerator from "@/components/qr/direct-qr-generator";
import AdminShell from "./AdminShell";

/** Le générateur gratuit, dans le cadre de l'administration. */
export default function AdminDirectQr() {
  return (
    <AdminShell active="new" title="QR code simple" hint="Tous les contenus sont libres pour l’équipe. Les clients ont le lien gratuit sur /qr-gratuit, le reste à 5 000 FCFA">
      {() => (
        <div className="mx-auto max-w-5xl">
          <Link href="/admin/nouveau" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Choix du parcours
          </Link>
          <div className="mt-6">
            <DirectQrGenerator mode="admin" />
          </div>
        </div>
      )}
    </AdminShell>
  );
}
