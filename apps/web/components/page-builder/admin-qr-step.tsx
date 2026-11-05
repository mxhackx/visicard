"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, CheckCircle2, Copy, ExternalLink, Loader2, QrCode, Smartphone } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminFetch } from "@/components/admin/use-admin-fetch";
import Stepper from "@/components/order/stepper";
import QrDesigner from "@/components/qr/qr-designer";
import StyledQr from "@/components/qr/styled-qr";
import { useFile } from "@/app/context/FileContext";
import { paletteFor } from "@/lib/palette";

const ADMIN_STEPS = ["Informations", "Apparence", "QR code"] as const;

interface Created {
  slug: string;
  cardUrl: string;
  qrStyle: string;
  logoUrl?: string | null;
}

/** Dernière étape admin d'une page digitale : style du QR code, puis création (QR actif tout de suite). */
export default function AdminQrStep() {
  return (
    <AdminShell active="new" title="Nouvelle page digitale" hint="Étape 3 sur 3 · QR code">
      {(token) => <QrBody adminToken={token} />}
    </AdminShell>
  );
}

function QrBody({ adminToken }: { adminToken: string }) {
  const adminFetch = useAdminFetch(adminToken);
  const { userInfo, restaurantInfo, customization, setQrStyle, resetAll } = useFile();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  if (created) return <Success created={created} onCopy={() => setCopied(true)} copied={copied} onDone={resetAll} />;

  if (!restaurantInfo.restaurantName.trim()) {
    return (
      <div className="surface mx-auto mt-6 max-w-lg p-8 text-center">
        <span className="icon-tile mx-auto h-12 w-12">
          <QrCode className="h-5 w-5" />
        </span>
        <h1 className="mt-4 text-xl font-semibold text-ink/90">Commencez par les informations</h1>
        <p className="mt-2 text-sm text-sage">Les informations saisies ne sont pas conservées après un rechargement de la page.</p>
        <Link href="/admin/nouveau/informations" className="btn btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" /> Aller aux informations
        </Link>
      </div>
    );
  }

  const brand = paletteFor(customization.themeId, customization.cardLayout).brand;

  const create = async () => {
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("serviceType", "page");
    body.append("clientName", userInfo.clientName.trim() || restaurantInfo.restaurantName);
    if (userInfo.userName.trim()) body.append("userName", userInfo.userName.trim());
    body.append("restaurantName", restaurantInfo.restaurantName);
    body.append("address", restaurantInfo.address || "");
    body.append("locationUrl", restaurantInfo.locationUrl);
    body.append("phoneNumber", restaurantInfo.phoneNumber);
    for (const key of ["facebookUrl", "instagramUrl", "xUrl", "snapchatUrl", "additionalInfo"] as const) {
      if (restaurantInfo[key]) body.append(key, restaurantInfo[key]);
    }
    body.append("schedule", JSON.stringify(restaurantInfo.schedule));
    body.append("themeId", customization.themeId);
    if (customization.cardLayout) body.append("cardLayout", customization.cardLayout);
    if (customization.qrStyle) body.append("qrStyle", customization.qrStyle);
    if (restaurantInfo.logoFile) body.append("logo", restaurantInfo.logoFile);
    restaurantInfo.menuFiles.forEach((f) => body.append("menu", f));
    restaurantInfo.placeFiles.forEach((f) => body.append("place", f));

    try {
      const res = await adminFetch("/cards", { method: "POST", body });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(typeof data?.message === "string" ? data.message : "La création a échoué.");
      setCreated({ slug: data.slug, cardUrl: data.cardUrl, qrStyle: data.qrStyle, logoUrl: data.logoUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "La création a échoué.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/nouveau/apparence" className="inline-flex items-center gap-1.5 text-sm font-medium text-sage hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Apparence
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.02em] text-ink/90 sm:text-3xl">Le QR code</h1>
          <p className="mt-1 text-sm text-sage">Le motif imprimé sur les tables. Il reste modifiable depuis la fiche de la page.</p>
        </div>
        <div className="w-full max-w-xl">
          <Stepper current={2} steps={ADMIN_STEPS} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="surface p-6 sm:p-7">
          <QrDesigner value={customization.qrStyle} onChange={setQrStyle} logoUrl={restaurantInfo.logoPreview} brandColor={brand} />
        </section>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface overflow-hidden">
            <div className="brand-surface px-6 py-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Récapitulatif</p>
              <p className="mt-2 truncate text-xl font-semibold">{restaurantInfo.restaurantName}</p>
              <p className="mt-1 text-sm text-white/75">Création admin : active tout de suite, sans devis.</p>
            </div>
            <ul className="space-y-2.5 px-6 py-5 text-sm text-ink/80">
              <Item>Informations et {restaurantInfo.menuFiles.length + restaurantInfo.placeFiles.length} photo(s)</Item>
              <Item>Disposition et couleurs choisies</Item>
              <Item>QR code personnalisé, PNG et SVG</Item>
            </ul>
            <div className="border-t border-line px-6 py-5">
              {error && (
                <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                  {error}
                </p>
              )}
              <button type="button" onClick={create} disabled={busy} className="btn btn-primary w-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <QrCode className="h-4 w-4" />}
                {busy ? "Création…" : "Créer la page et le QR code"}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2.5">
      <Check className="h-4 w-4 shrink-0 text-forest" />
      {children}
    </li>
  );
}

function Success({ created, copied, onCopy, onDone }: { created: Created; copied: boolean; onCopy: () => void; onDone: () => void }) {
  const copy = async () => {
    await navigator.clipboard.writeText(created.cardUrl).catch(() => {});
    onCopy();
  };
  return (
    <div className="mx-auto max-w-3xl">
      <div className="surface grid gap-8 p-6 sm:p-8 md:grid-cols-[260px_1fr] md:items-center">
        <StyledQr data={created.cardUrl} style={created.qrStyle} logoUrl={created.logoUrl} size={240} downloadName={`moncode-${created.slug}`} />
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckCircle2 className="h-4 w-4" /> Page publiée
          </span>
          <h1 className="mt-4 text-2xl font-semibold tracking-[-0.02em] text-ink/90">Le QR code est actif</h1>
          <p className="mt-2 text-sm leading-6 text-sage">Téléchargez-le pour l’impression (PNG haute définition ou SVG vectoriel). Scannez-le une fois pour vérifier avant d’imprimer.</p>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-ink/80">{created.cardUrl}</span>
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-medium text-forest">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
            </button>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/admin/cartes/${created.slug}`} onClick={onDone} className="btn btn-primary btn-sm">
              Fiche de la page
            </Link>
            <a href={created.cardUrl} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
              <Smartphone className="h-4 w-4" /> Ouvrir la page <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link href="/admin/nouveau" onClick={onDone} className="btn btn-outline btn-sm">
              Nouveau QR code
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
