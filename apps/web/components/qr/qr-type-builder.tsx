"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Crown, FileText, Lock, Smartphone, Video } from "lucide-react";
import { useRouter } from "next/navigation";
import { MediaFields, MediaOrder } from "./media-fields";
import { type PremiumOffer } from "./premium-modal";
import PremiumModal from "./premium-modal";
import { useDialogs } from "@/components/account/auth-dialog";
import { usePremium } from "@/lib/premium";
import StyledQr from "./styled-qr";
import QrStyleCards from "./qr-style-cards";
import TypeArt from "./type-art";
import { Fields, LogoPicker, OrderPanel, hasInput, type AllData } from "./direct-qr-generator";
import DevicePreview, { DeviceSwitch, type Device } from "@/components/page-builder/device-preview";
import { QR_DOTS, parseQrStyle, DEFAULT_QR_STYLE } from "@/lib/qr-style";
import FedapayBadge from "@/components/fedapay-badge";
import {
  DENSE_PAYLOAD,
  DIRECT_QR_DEFAULTS,
  DIRECT_QR_TYPES,
  encodeDirectQr,
  type DirectQrData,
  type DirectQrType,
} from "@/lib/qr-payloads";

const DEVICES = ["phone", "tablet", "laptop"] as const;

const DRAFT_KEY = "moncode_qr_draft";
/** L'avertissement « option Premium » ne s'affiche qu'une fois par session. */
const TRIAL_KEY = "moncode_premium_trial";

/** Couleurs gratuites : le noir d'origine et le rouge Moncode. */
const FREE_COLORS = [{ fg: DEFAULT_QR_STYLE.fg, bg: DEFAULT_QR_STYLE.bg }, { fg: "#c81d25", bg: "#ffffff" }];

/** Vrai quand le style utilise une option Premium (formes, coins, couleurs ou logo). */
function usesPremium(qrStyle: string, logo: string | null): boolean {
  const st = parseQrStyle(qrStyle);
  return (
    Boolean(logo) ||
    QR_DOTS.slice(-4).some((d) => d.id === st.dots) ||
    st.corners === "dot" ||
    !FREE_COLORS.some((c) => c.fg === st.fg && c.bg === st.bg)
  );
}

const toDataUrl = async (url: string) => {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
};

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
 * Créateur de QR code unique, sur /creer : le type vient de l'adresse (`?type=wifi`), le lien web est
 * gratuit, tout le reste est Premium. À gauche la saisie (contenu, style), à droite l'aperçu en direct.
 * Les options Premium s'essaient d'abord ; le paiement (compte, puis FedaPay) vient en bas, à la fin.
 */
export type BuilderType = DirectQrType | "media" | "document";

export default function QrTypeBuilder({ type }: { type: BuilderType }) {
  const media = type === "media" || type === "document";
  const dtype: DirectQrType = media ? "url" : type;
  const meta = DIRECT_QR_TYPES.find((t) => t.id === dtype)!;
  const isUrl = type === "url";
  const [mediaTitle, setMediaTitle] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [all, setAll] = useState<AllData>(DIRECT_QR_DEFAULTS);
  const [qrStyle, setQrStyle] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [device, setDevice] = useState<Device>("phone");
  const [offer, setOffer] = useState<PremiumOffer | null>(null);
  const router = useRouter();
  const premium = usePremium();
  const { openPremium } = useDialogs();
  const [trial, setTrial] = useState(false);
  const locked = !premium.active && !trial;
  // « Essayer » débloque tout ; le paiement attend alors en bas de page, une fois le contenu prêt.
  const needsPay = !premium.active && (!isUrl || trial || usesPremium(qrStyle, media ? null : logo));
  const suite = isUrl ? "/creer" : `/creer?type=${type}`;

  // Une option Premium : on prévient, puis on débloque pour essayer. Le paiement vient à la fin.
  const startTrial = () => {
    setTrial(true);
    try {
      sessionStorage.setItem(TRIAL_KEY, "1");
    } catch {}
  };
  const askTry = (label: string) => setOffer({ label, href: "/creer", price: PRICE_QR, onTry: startTrial });
  const openOffer = (o: PremiumOffer & { free?: boolean }) =>
    premium.active || o.free || trial
      ? router.push(o.href, { scroll: false })
      : setOffer({ ...o, onTry: () => (startTrial(), router.push(o.href, { scroll: false })) });

  // Déjà prévenu pendant cette session : plus d'avertissement, tout reste débloqué.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(TRIAL_KEY)) queueMicrotask(() => setTrial(true));
    } catch {}
  }, []);

  // Retour du paiement : on retrouve le contenu, le style et le logo laissés avant la connexion.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      sessionStorage.removeItem(DRAFT_KEY);
      const d = JSON.parse(raw) as { all?: AllData; qrStyle?: string; logo?: string | null };
      queueMicrotask(() => {
        if (d.all) setAll(d.all);
        if (d.qrStyle) setQrStyle(d.qrStyle);
        if (d.logo) setLogo(d.logo);
        setTrial(true);
      });
    } catch {}
  }, []);

  const goToPayment = async () => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ all, qrStyle, logo: logo ? await toDataUrl(logo) : null }));
    } catch {}
    openPremium({ label: "Télécharger mon QR code", suite });
  };

  const data = all[dtype];
  const update = <K extends DirectQrType>(key: K, patch: Partial<DirectQrData[K]>) =>
    setAll((a) => ({ ...a, [key]: { ...a[key], ...patch } }));
  const { payload: directPayload, error } = encodeDirectQr(dtype, data);
  // Image, vidéo et PDF : l'adresse du QR n'existe qu'à la création ; l'aperçu montre un exemple.
  const payload = media ? "https://moncode.bj/c/votre-fichier" : directPayload;

  useEffect(() => () => void (logo && URL.revokeObjectURL(logo)), [logo]);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <div className="flex items-center gap-4">
        {media ? (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-leaf text-ambre-deep">
            {type === "document" ? <FileText className="h-7 w-7" /> : <Video className="h-7 w-7" />}
          </span>
        ) : (
          <TypeArt type={dtype} className="h-14 w-14 shrink-0" />
        )}
        <div>
          <h1 className="page-title">Créez votre QR code</h1>
          <p className="text-sm text-sage">{media ? "Envoyez votre fichier : le QR code ouvre une page de lecture mobile." : isUrl ? "Collez un lien, choisissez le style, téléchargez en PNG et SVG." : meta.hint}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Step n={1} title="Contenu">
            <OtherContents current={type} onPick={openOffer} premium={!locked} />
            <div className="mt-6">
              {media ? (
                <MediaFields kind={type as "media" | "document"} title={mediaTitle} onTitle={setMediaTitle} file={mediaFile} onFile={setMediaFile} />
              ) : (
                <Fields type={dtype} data={data} update={update} />
              )}
            </div>
            {!media && error && payload === "" && hasInput(data) && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-amber-700">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </p>
            )}
          </Step>

          <Step n={2} title="Style" aside={media ? undefined : <LogoPicker value={logo} onChange={setLogo} locked={locked} onPremium={() => askTry("Logo au centre")} />}>
            <QrStyleCards value={qrStyle} onChange={setQrStyle} lockPremium={locked} onPremium={askTry} />
          </Step>

          {needsPay && (
            <Step n={3} title="Télécharger mon QR code">
              <p className="text-sm leading-6 text-sage">
                Votre QR code utilise des options Premium. Connectez-vous, puis réglez {PRICE_QR} FCFA par FedaPay : le téléchargement s’ouvre aussitôt.
              </p>
              <button type="button" onClick={goToPayment} className="btn btn-primary mt-4 w-full max-w-sm justify-center py-3.5 text-base">
                Passer au paiement · {PRICE_QR} FCFA
              </button>
              <FedapayBadge className="mt-3 flex" />
            </Step>
          )}

          {!isUrl && !needsPay && (
            <Step n={3} title="Obtenir le QR code">
              {media ? (
                <MediaOrder kind={type as "media" | "document"} title={mediaTitle} file={mediaFile} qrStyle={qrStyle} />
              ) : payload ? (
                <>
                  {payload.length > DENSE_PAYLOAD && (
                    <p className="mb-3 flex items-start gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      Contenu long ({payload.length} caractères) : imprimez le QR en 3 cm minimum et testez le scan.
                    </p>
                  )}
                  <OrderPanel type={dtype} payload={payload} title={meta.label} qrStyle={qrStyle} logo={logo} />
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
                <QrScreen device={device} type={dtype} payload={payload} qrStyle={qrStyle} logo={media ? null : logo} locked={media} media={media} />
              </DevicePreview>
            </div>
            {payload ? (
              <div className="mt-5">
                {needsPay ? (
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-sage">
                    <Lock className="h-3.5 w-3.5" /> Le téléchargement est débloqué après le paiement Premium.
                  </p>
                ) : isUrl ? (
                  <StyledQr data={payload} style={qrStyle} logoUrl={logo} downloadName="qr-lien" hideQr />
                ) : (
                  <p className="flex items-center justify-center gap-1.5 text-center text-xs text-sage">
                    <Lock className="h-3.5 w-3.5" /> Le QR code net est livré après sa création, à l’étape 3.
                  </p>
                )}
                {!media && (
                  <p className="mt-3 text-center text-xs leading-5 text-sage">
                    Le contenu est inscrit dans le QR code : il fonctionne sans passer par Moncode, mais ne peut plus être modifié une fois imprimé.
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-4 text-center text-xs text-sage">{isUrl ? "Collez une adresse pour générer le QR code." : "Complétez le contenu pour générer le QR code."}</p>
            )}
          </div>
        </aside>
      </div>
      <PremiumModal offer={offer} onClose={() => setOffer(null)} />
    </section>
  );
}

const PRICE_QR = "5 000";

interface Tile {
  id: string;
  label: string;
  href: string;
  free?: boolean;
  art?: DirectQrType;
  icon?: typeof Video;
}

const TILES: Tile[] = [
  { id: "url", label: "Lien web", href: "/creer", free: true, art: "url" },
  ...DIRECT_QR_TYPES.filter((t) => t.id !== "url").map((t) => ({ id: t.id, label: t.label, href: `/creer?type=${t.id}`, art: t.id })),
  { id: "media", label: "Image ou vidéo", href: "/creer?type=media", icon: Video },
  { id: "document", label: "Document PDF", href: "/creer?type=document", icon: FileText },
  { id: "page", label: "Page digitale", href: "/creer?type=page", icon: Smartphone },
];

/** Tous les contenus possibles, en un seul choix : le lien web est gratuit, les autres sont Premium (couronne). */
function OtherContents({ current, onPick, premium }: { current: string; onPick: (o: PremiumOffer & { free?: boolean }) => void; premium: boolean }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-sage">Que mettre dans le QR code ?</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {TILES.map((t) => {
          const on = t.id === current;
          const dim = !t.free && !premium && !on;
          return (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => (on ? undefined : onPick({ label: t.label, href: t.href, price: PRICE_QR, free: t.free }))}
                className={`group relative flex w-full flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition active:scale-[0.97] ${
                  on ? "border-forest ring-2 ring-forest/30" : "border-line hover:-translate-y-0.5 hover:border-ink/30"
                }`}
              >
                <span className={dim ? "opacity-60 blur-[1.5px] transition group-hover:blur-[0.5px]" : ""}>
                  {t.art ? (
                    <TypeArt type={t.art} className="h-10 w-10" />
                  ) : t.icon ? (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-leaf text-ambre-deep"><t.icon className="h-5 w-5" /></span>
                  ) : null}
                </span>
                <span className="text-xs font-medium leading-4 text-ink/80">{t.label}</span>
                {!t.free && (
                  <Crown className="premium-gold absolute right-1.5 top-1.5 h-4 w-4 rounded-full p-0.5" aria-hidden="true" />
                )}
                {on && (
                  <span className={`absolute top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-forest text-white ${t.free ? "right-1.5" : "left-1.5"}`}>
                    <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
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
  media = false,
}: {
  device: Device;
  type: DirectQrType;
  payload: string;
  qrStyle: string;
  logo: string | null;
  /** Payant : QR flouté jusqu'au paiement. Gratuit : QR net. */
  locked: boolean;
  /** Image, vidéo ou PDF : l'exemple de QR est flouté jusqu'à la création avec le fichier. */
  media?: boolean;
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
            <Lock className="h-4 w-4" /> {media ? "Créé avec votre fichier" : !ready ? (type === "url" ? "Collez votre lien" : "Complétez le contenu") : "Débloqué après paiement"}
          </span>
        </span>
      )}
    </div>
  );

  const label = media ? "Scannez pour ouvrir le fichier" : `Scannez pour ${ACTION[type]}`;

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
