"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Lock } from "lucide-react";
import StyledQr from "./styled-qr";
import QrStyleCards from "./qr-style-cards";
import TypeArt from "./type-art";
import { Fields, LogoPicker, OrderPanel, hasInput, type AllData } from "./direct-qr-generator";
import DevicePreview, { DeviceSwitch, type Device } from "@/components/page-builder/device-preview";
import { parseQrStyle } from "@/lib/qr-style";
import {
  DENSE_PAYLOAD,
  DIRECT_QR_DEFAULTS,
  DIRECT_QR_TYPES,
  encodeDirectQr,
  type DirectQrData,
  type DirectQrType,
} from "@/lib/qr-payloads";

const DEVICES = ["phone", "tablet", "laptop"] as const;

/** Ce que fait le téléphone au scan : sert de légende dans l'aperçu. */
const ACTION: Record<DirectQrType, string> = {
  url: "ouvrir le lien",
  text: "lire le message",
  vcard: "enregistrer le contact",
  tel: "appeler",
  sms: "écrire un SMS",
  email: "envoyer un e-mail",
  wifi: "rejoindre le Wi-Fi",
  event: "ajouter à l’agenda",
  geo: "ouvrir l’itinéraire",
};

/**
 * Page d'un QR code direct : à gauche la saisie (contenu, style en cartes, commande),
 * à droite la création du QR code en direct sur téléphone, iPad ou Mac.
 * `free` : lien web gratuit, sans commande ; l'aperçu est net et téléchargeable.
 */
export default function QrTypeBuilder({ type, free = false }: { type: DirectQrType; free?: boolean }) {
  const meta = DIRECT_QR_TYPES.find((t) => t.id === type)!;
  const [all, setAll] = useState<AllData>(DIRECT_QR_DEFAULTS);
  const [qrStyle, setQrStyle] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("phone");

  const data = all[type];
  const update = <K extends DirectQrType>(key: K, patch: Partial<DirectQrData[K]>) =>
    setAll((a) => ({ ...a, [key]: { ...a[key], ...patch } }));
  const { payload, error } = encodeDirectQr(type, data);

  useEffect(() => () => void (logo && URL.revokeObjectURL(logo)), [logo]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex items-center gap-4">
        <TypeArt type={type} className="h-14 w-14 shrink-0" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-forest">{free ? "Gratuit · sans compte" : "QR code"}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-ink sm:text-3xl">{free ? "Un QR code pour votre lien" : meta.label}</h1>
          <p className="text-sm text-sage">{free ? "Collez l’adresse, choisissez le style, téléchargez en PNG et SVG." : meta.hint}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Step n={1} title="Contenu">
            <Fields type={type} data={data} update={update} />
            {error && payload === "" && hasInput(data) && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
          </Step>

          <Step n={2} title="Style" aside={<LogoPicker value={logo} onChange={setLogo} />}>
            <QrStyleCards value={qrStyle} onChange={setQrStyle} />
          </Step>

          {!free && (
          <Step n={3} title="Obtenir le QR code">
            {payload ? (
              <>
                {payload.length > DENSE_PAYLOAD && (
                  <p className="mb-3 flex items-start gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Contenu long ({payload.length} caractères) : imprimez le QR en 3 cm minimum et testez le scan.
                  </p>
                )}
                <OrderPanel type={type} payload={payload} title={meta.label} qrStyle={qrStyle} logo={logo} />
              </>
            ) : (
              <p className="rounded-xl bg-cream-deep px-4 py-6 text-center text-sm text-sage">
                {error ?? "Complétez le contenu pour continuer."}
              </p>
            )}
          </Step>
          )}
        </div>

        <aside className="order-first min-w-0 lg:sticky lg:top-24 lg:order-none">
          <div className="surface p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink/80">Aperçu</p>
              <DeviceSwitch value={device} onChange={setDevice} devices={DEVICES} />
            </div>
            <div className="mt-5">
              <DevicePreview device={device}>
                <QrScreen device={device} type={type} payload={payload} qrStyle={qrStyle} logo={logo} locked={!free} />
              </DevicePreview>
            </div>
            {free ? (
              payload ? (
                <div className="mt-5">
                  <StyledQr data={payload} style={qrStyle} logoUrl={logo} downloadName="qr-lien" hideQr />
                  <p className="mt-3 text-center text-xs leading-5 text-sage">
                    Le QR code fonctionne sans connexion à Moncode, mais il ne peut plus être modifié une fois imprimé.
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-center text-xs text-sage">Collez une adresse pour générer le QR code.</p>
              )
            ) : (
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-sage">
                <Lock className="h-3.5 w-3.5" /> Le QR code net est débloqué après le paiement.
              </p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}

function Step({ n, title, aside, children }: { n: number; title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="surface p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-3 text-base font-semibold text-ink/90">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest text-sm font-semibold text-white">{n}</span>
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Contenu de l'écran simulé, rendu à la vraie largeur de l'appareil (puis réduit). */
function QrScreen({
  device,
  type,
  payload,
  qrStyle,
  logo,
  locked,
}: {
  device: Device;
  type: DirectQrType;
  payload: string;
  qrStyle: string;
  logo: string | null;
  /** Payant : QR flouté jusqu'au paiement. Gratuit : QR net. */
  locked: boolean;
}) {
  const style = parseQrStyle(qrStyle);
  const wide = device === "laptop" || device === "desktop";
  const size = device === "phone" ? 270 : device === "tablet" ? 480 : 440;
  const ready = Boolean(payload);

  const qr = (
    <div className="relative rounded-[28px] bg-white p-6 shadow-[0_24px_60px_rgba(23,23,26,0.14)] ring-1 ring-black/5">
      {/* Payant : aperçu flouté tant que la commande n'est pas payée (le QR net est livré après paiement). */}
      <div className={locked || !ready ? "blur-[9px]" : undefined} aria-hidden={locked || !ready || undefined}>
        <StyledQr data={ready ? payload : "https://moncode.app"} style={style} logoUrl={logo} size={size} />
      </div>
      {(locked || !ready) && (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-[15px] font-semibold text-white" style={{ fontSize: device === "phone" ? 15 : 22 }}>
            <Lock className="h-4 w-4" /> {!ready ? (locked ? "Complétez le contenu" : "Collez votre lien") : "Débloqué après paiement"}
          </span>
        </span>
      )}
    </div>
  );

  const label = `Scannez pour ${ACTION[type]}`;

  if (wide) {
    return (
      <div className="flex h-full w-full items-center justify-center gap-24 bg-[radial-gradient(60%_60%_at_75%_40%,rgba(227,5,29,0.08),transparent),linear-gradient(#fff,#fbf5f5)] px-24">
        <div className="max-w-[560px]">
          <p className="text-[22px] font-semibold uppercase tracking-[0.18em] text-forest">QR code</p>
          <h3 className="mt-5 text-[76px] font-bold leading-[1.02] tracking-[-0.03em] text-ink">{label}</h3>
          <p className="mt-6 text-[26px] leading-9 text-sage">Ouvrez l’appareil photo de votre téléphone et pointez-le vers le code.</p>
        </div>
        {qr}
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(70%_50%_at_50%_30%,rgba(227,5,29,0.08),transparent),linear-gradient(#fff,#fbf5f5)] px-8 text-center">
      <p className={`font-bold leading-tight tracking-[-0.02em] text-ink ${device === "phone" ? "mb-8 text-[30px]" : "mb-14 text-[52px]"}`}>{label}</p>
      {qr}
      <p className={`text-sage ${device === "phone" ? "mt-8 text-[17px]" : "mt-14 text-[26px]"}`}>Pointez l’appareil photo vers le code</p>
    </div>
  );
}
