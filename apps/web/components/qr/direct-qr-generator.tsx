"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Lock,
  Loader2,
  AlertTriangle,
  CalendarDays,
  Check,
  Contact,
  Copy,
  Crown,
  ImagePlus,
  Link2,
  LocateFixed,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  QrCode,
  Type,
  Wifi,
  X,
} from "lucide-react";
import AccountGate from "@/components/account/account-gate";
import { usePremium } from "@/lib/premium";
import QrDesigner from "./qr-designer";
import AddressSearch from "@/components/address-search";
import CustomerFields, { emptyCustomer, type CustomerDraft } from "@/components/order/customer-fields";
import { createOrder, payOrder, validateCustomer } from "@/lib/orders";
import { coordsFromUrl } from "@/lib/page-design";
import {
  DENSE_PAYLOAD,
  DIRECT_QR_DEFAULTS,
  DIRECT_QR_TYPES,
  encodeDirectQr,
  isFreeDirectType,
  type DirectQrData,
  type DirectQrType,
} from "@/lib/qr-payloads";

export const ICONS: Record<DirectQrType, typeof Link2> = {
  url: Link2,
  text: Type,
  vcard: Contact,
  tel: Phone,
  sms: MessageSquare,
  email: Mail,
  wifi: Wifi,
  event: CalendarDays,
  geo: MapPin,
};

export type AllData = { [K in DirectQrType]: DirectQrData[K] };

/**
 * Générateur gratuit de QR codes directs (lien, texte, vCard, appel, SMS, e-mail,
 * Wi-Fi, événement, GPS), utilisé sur la page publique /creer et dans l'admin.
 * Tout se passe dans le navigateur : rien n'est enregistré ni envoyé à l'API
 * (un mot de passe Wi-Fi ne quitte pas la page).
 */
export default function DirectQrGenerator({
  mode = "public",
  types,
}: {
  mode?: "public" | "admin";
  /** Types proposés (tous par défaut). Un seul type : le choix du contenu est masqué. */
  types?: readonly DirectQrType[];
}) {
  const offered = DIRECT_QR_TYPES.filter((t) => !types || types.includes(t.id));
  const [type, setType] = useState<DirectQrType>(offered[0]?.id ?? "url");
  const [all, setAll] = useState<AllData>(DIRECT_QR_DEFAULTS);
  const [qrStyle, setQrStyle] = useState("");
  const [logo, setLogo] = useState<string | null>(null);

  const data = all[type];
  const update = <K extends DirectQrType>(key: K, patch: Partial<DirectQrData[K]>) =>
    setAll((a) => ({ ...a, [key]: { ...a[key], ...patch } }));

  const { payload, error } = encodeDirectQr(type, data);
  // Public : seul le lien est gratuit. Admin : tout est libre (c'est l'outil de l'équipe).
  const locked = mode === "public" && !isFreeDirectType(type);
  const meta = DIRECT_QR_TYPES.find((t) => t.id === type)!;

  useEffect(() => () => void (logo && URL.revokeObjectURL(logo)), [logo]);

  return (
    <div>
      {/* 1. Type de contenu */}
      {offered.length > 1 && (
      <section>
        <h2 className="text-base font-semibold text-ink/90">Contenu du QR code</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" role="radiogroup">
          {offered.map((t) => {
            const Icon = ICONS[t.id];
            const on = t.id === type;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => setType(t.id)}
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                  on ? "border-forest bg-forest text-white" : "border-line bg-white text-ink/80 hover:border-ambre/60"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{t.label}</span>
                {mode === "public" && (
                  <span
                    className={`ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none ${
                      isFreeDirectType(t.id)
                        ? on ? "bg-white/20 text-white" : "bg-emerald-50 text-emerald-700"
                        : on ? "bg-white/20 text-white" : "bg-cream-deep text-sage"
                    }`}
                  >
                    {isFreeDirectType(t.id) ? "Gratuit" : null}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
      )}

      {/* 2. Formulaire propre au type */}
      <section className={`surface p-6 sm:p-8 ${offered.length > 1 ? "mt-6" : ""}`}>
        <p className="text-sm text-sage">{meta.hint}</p>
        <div className="mt-5">
          <Fields type={type} data={data} update={update} />
        </div>
        {error && payload === "" && hasInput(data) && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-amber-700">
            <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
          </p>
        )}
      </section>

      {/* 3. Style, aperçu et téléchargement */}
      <section className="surface mt-6 p-6 sm:p-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-ink/90">
            <QrCode className="h-4 w-4 text-forest" /> Style et téléchargement
          </p>
          <LogoPicker value={logo} onChange={setLogo} />
        </div>
        {payload ? (
          <>
            <div className="relative">
              <div
                className={locked ? "pointer-events-none select-none [&_.surface-soft]:blur-[7px]" : undefined}
                aria-hidden={locked || undefined}
              >
                <QrDesigner
                  value={qrStyle}
                  onChange={setQrStyle}
                  data={payload}
                  logoUrl={logo}
                  downloadName={locked ? undefined : `qr-${type}`}
                />
              </div>
              {locked && (
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-white md:left-[calc(130px-4.5rem)]">
                  <Lock className="h-3.5 w-3.5" /> Aperçu verrouillé
                </span>
              )}
            </div>
            {payload.length > DENSE_PAYLOAD && (
              <p className="mt-4 flex items-start gap-1.5 text-xs text-amber-700">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Contenu long ({payload.length} caractères) : imprimez le QR en 3 cm minimum et testez le scan.
              </p>
            )}
            <PayloadPreview payload={payload} />
          </>
        ) : (
          <p className="rounded-xl bg-cream-deep px-4 py-8 text-center text-sm text-sage">
            {error ?? "Complétez le formulaire pour générer le QR code."}
          </p>
        )}
        {locked ? (
          payload && (
            <OrderPanel
              type={type}
              payload={payload}
              title={meta.label}
              qrStyle={qrStyle}
              logo={logo}
            />
          )
        ) : (
          <p className="mt-5 text-xs leading-5 text-sage">
            Le contenu est inscrit dans le QR code : il fonctionne sans passer par Moncode, mais ne peut plus être modifié une fois imprimé.
          </p>
        )}
      </section>
    </div>
  );
}

export function hasInput(data: object): boolean {
  return Object.values(data).some((v) => typeof v === "string" && v.trim() !== "");
}

/* ------------------------------------------------------------------
   Champs par type
------------------------------------------------------------------ */

type Update = <K extends DirectQrType>(key: K, patch: Partial<DirectQrData[K]>) => void;

export function Fields({ type, data, update }: { type: DirectQrType; data: AllData[DirectQrType]; update: Update }) {
  switch (type) {
    case "url": {
      const d = data as DirectQrData["url"];
      return (
        <Field label="Adresse (URL)" full>
          <input
            className="field"
            type="url"
            inputMode="url"
            placeholder="https://exemple.com/menu"
            value={d.url}
            onChange={(e) => update("url", { url: e.target.value })}
          />
        </Field>
      );
    }
    case "text": {
      const d = data as DirectQrData["text"];
      return (
        <Field label="Texte" full>
          <textarea
            className="field"
            rows={5}
            maxLength={1000}
            placeholder="Code promo : BIENVENUE10"
            value={d.text}
            onChange={(e) => update("text", { text: e.target.value })}
          />
        </Field>
      );
    }
    case "vcard": {
      const d = data as DirectQrData["vcard"];
      const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement>) => update("vcard", { [k]: e.target.value });
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Prénom"><input className="field" value={d.firstName} onChange={set("firstName")} autoComplete="off" /></Field>
          <Field label="Nom"><input className="field" value={d.lastName} onChange={set("lastName")} autoComplete="off" /></Field>
          <Field label="Entreprise"><input className="field" value={d.org} onChange={set("org")} /></Field>
          <Field label="Fonction"><input className="field" value={d.title} onChange={set("title")} /></Field>
          <Field label="Mobile"><input className="field" type="tel" placeholder="+229 01 00 00 00 00" value={d.mobile} onChange={set("mobile")} /></Field>
          <Field label="Téléphone fixe"><input className="field" type="tel" value={d.work} onChange={set("work")} /></Field>
          <Field label="E-mail"><input className="field" type="email" value={d.email} onChange={set("email")} /></Field>
          <Field label="Site web"><input className="field" type="url" placeholder="exemple.com" value={d.website} onChange={set("website")} /></Field>
          <Field label="Adresse" full><input className="field" value={d.address} onChange={set("address")} /></Field>
        </div>
      );
    }
    case "tel": {
      const d = data as DirectQrData["tel"];
      return (
        <Field label="Numéro à appeler" full>
          <input className="field" type="tel" placeholder="+229 01 00 00 00 00" value={d.phone} onChange={(e) => update("tel", { phone: e.target.value })} />
        </Field>
      );
    }
    case "sms": {
      const d = data as DirectQrData["sms"];
      return (
        <div className="grid gap-4">
          <Field label="Numéro du destinataire">
            <input className="field" type="tel" placeholder="+229 01 00 00 00 00" value={d.phone} onChange={(e) => update("sms", { phone: e.target.value })} />
          </Field>
          <Field label="Message">
            <textarea className="field" rows={4} maxLength={600} value={d.message} onChange={(e) => update("sms", { message: e.target.value })} />
          </Field>
        </div>
      );
    }
    case "email": {
      const d = data as DirectQrData["email"];
      return (
        <div className="grid gap-4">
          <Field label="Destinataire">
            <input className="field" type="email" placeholder="contact@exemple.com" value={d.to} onChange={(e) => update("email", { to: e.target.value })} />
          </Field>
          <Field label="Objet">
            <input className="field" value={d.subject} onChange={(e) => update("email", { subject: e.target.value })} />
          </Field>
          <Field label="Message">
            <textarea className="field" rows={4} maxLength={600} value={d.body} onChange={(e) => update("email", { body: e.target.value })} />
          </Field>
        </div>
      );
    }
    case "wifi": {
      const d = data as DirectQrData["wifi"];
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom du réseau (SSID)">
            <input className="field" value={d.ssid} onChange={(e) => update("wifi", { ssid: e.target.value })} autoComplete="off" spellCheck={false} />
          </Field>
          <Field label="Sécurité">
            <select className="field" value={d.security} onChange={(e) => update("wifi", { security: e.target.value as DirectQrData["wifi"]["security"] })}>
              <option value="WPA">WPA / WPA2 / WPA3</option>
              <option value="WEP">WEP</option>
              <option value="nopass">Aucune (réseau ouvert)</option>
            </select>
          </Field>
          {d.security !== "nopass" && (
            <Field label="Mot de passe">
              <input className="field" value={d.password} onChange={(e) => update("wifi", { password: e.target.value })} autoComplete="off" spellCheck={false} />
            </Field>
          )}
          <label className="flex items-center gap-2.5 self-end pb-3 text-sm text-ink/85">
            <input type="checkbox" className="h-4 w-4 accent-[var(--color-forest)]" checked={d.hidden} onChange={(e) => update("wifi", { hidden: e.target.checked })} />
            Réseau masqué
          </label>
        </div>
      );
    }
    case "event": {
      const d = data as DirectQrData["event"];
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom de l'événement" full>
            <input className="field" value={d.title} onChange={(e) => update("event", { title: e.target.value })} />
          </Field>
          <Field label="Début">
            <input className="field" type="datetime-local" value={d.start} onChange={(e) => update("event", { start: e.target.value })} />
          </Field>
          <Field label="Fin">
            <input className="field" type="datetime-local" min={d.start || undefined} value={d.end} onChange={(e) => update("event", { end: e.target.value })} />
          </Field>
          <Field label="Lieu" full>
            <input className="field" value={d.location} onChange={(e) => update("event", { location: e.target.value })} />
          </Field>
          <Field label="Description" full>
            <textarea className="field" rows={3} maxLength={500} value={d.description} onChange={(e) => update("event", { description: e.target.value })} />
          </Field>
        </div>
      );
    }
    case "geo":
      return <GeoFields d={data as DirectQrData["geo"]} update={update} />;
  }
}

function GeoFields({ d, update }: { d: DirectQrData["geo"]; update: Update }) {
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const locate = () => {
    if (!navigator.geolocation) return setGeoError("Géolocalisation indisponible sur cet appareil.");
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        update("geo", { lat: pos.coords.latitude.toFixed(6), lng: pos.coords.longitude.toFixed(6) });
        setLocating(false);
      },
      () => {
        setGeoError("Position refusée ou introuvable.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field label="Rechercher une adresse" full>
        <AddressSearch onPick={(p) => update("geo", { lat: p.lat.toFixed(6), lng: p.lng.toFixed(6) })} />
      </Field>
      <Field label="Coller un lien Google Maps (facultatif)" full>
        <input
          className="field"
          placeholder="https://www.google.com/maps/@6.3654,2.4183,15z"
          onChange={(e) => {
            const c = coordsFromUrl(e.target.value);
            if (c) update("geo", { lat: String(c.lat), lng: String(c.lng) });
          }}
        />
      </Field>
      <Field label="Latitude">
        <input className="field" inputMode="decimal" placeholder="6.365400" value={d.lat} onChange={(e) => update("geo", { lat: e.target.value })} />
      </Field>
      <Field label="Longitude">
        <input className="field" inputMode="decimal" placeholder="2.418300" value={d.lng} onChange={(e) => update("geo", { lng: e.target.value })} />
      </Field>
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button type="button" onClick={locate} disabled={locating} className="btn btn-outline btn-sm">
          <LocateFixed className="h-4 w-4" /> {locating ? "Localisation…" : "Ma position actuelle"}
        </button>
        {geoError && <span className="text-xs text-red-600">{geoError}</span>}
      </div>
      <Field label="Format" full>
        <select className="field" value={d.format} onChange={(e) => update("geo", { format: e.target.value as "maps" | "geo" })}>
          <option value="maps">Lien Google Maps (iPhone et Android)</option>
          <option value="geo">geo: (appli de carte par défaut, surtout Android)</option>
        </select>
      </Field>
    </div>
  );
}

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={`block ${full ? "sm:col-span-2" : ""}`}>
      <span className="mb-1.5 block text-xs font-semibold text-ink/70">{label}</span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------------
   Logo facultatif et contenu brut
------------------------------------------------------------------ */

export function LogoPicker({ value, onChange, locked = false, onPremium }: { value: string | null; onChange: (url: string | null) => void; locked?: boolean; onPremium?: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  if (locked) {
    return (
      <button type="button" onClick={onPremium} className="btn btn-outline btn-sm">
        <ImagePlus className="h-4 w-4 opacity-60 blur-[1px]" /> Ajouter un logo <span className="premium-pill"><Crown className="h-3 w-3" /> Premium</span>
      </button>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onChange(URL.createObjectURL(f));
          e.target.value = "";
        }}
      />
      {value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-8 w-8 rounded-lg object-contain ring-1 ring-line" />
          <button type="button" onClick={() => onChange(null)} className="btn btn-outline btn-sm">
            <X className="h-4 w-4" /> Retirer le logo
          </button>
        </>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="btn btn-outline btn-sm">
          <ImagePlus className="h-4 w-4" /> Ajouter un logo
        </button>
      )}
    </div>
  );
}

function PayloadPreview({ payload }: { payload: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* presse-papiers refusé : le texte reste sélectionnable */
    }
  };
  return (
    <details className="mt-5 rounded-xl border border-line bg-white">
      <summary className="cursor-pointer px-4 py-2.5 text-xs font-semibold text-ink/70">Contenu encodé dans le QR</summary>
      <div className="border-t border-line p-4">
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap break-all font-mono text-xs text-ink/80">{payload}</pre>
        <button type="button" onClick={copy} className="btn btn-outline btn-sm mt-3">
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? "Copié" : "Copier"}
        </button>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------
   Commande d'un QR direct payant : devis, puis paiement en ligne (FedaPay)
------------------------------------------------------------------ */

export function OrderPanel({
  payload,
  title,
  qrStyle,
  logo,
}: {
  type: DirectQrType;
  payload: string;
  title: string;
  qrStyle: string;
  logo: string | null;
}) {
  const router = useRouter();
  const premium = usePremium();
  const [customer, setCustomer] = useState<CustomerDraft>(emptyCustomer);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validateCustomer(customer);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("serviceType", "direct");
      body.append("title", title);
      body.append("directPayload", payload);
      body.append("customerName", customer.name.trim());
      body.append("customerPhone", customer.phone.trim());
      if (customer.email.trim()) body.append("customerEmail", customer.email.trim());
      if (qrStyle) body.append("qrStyle", qrStyle);
      if (logo) body.append("logo", await (await fetch(logo)).blob(), "logo");
      const order = await createOrder(body);
      if (!(await payOrder(order))) router.push(`/commande/${order.reference}?cle=${encodeURIComponent(order.accessToken)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
      setBusy(false);
    }
  };

  return (
    <AccountGate>
    <form onSubmit={submit} className="mt-6 rounded-2xl border border-line bg-cream-deep p-5 sm:p-6" noValidate>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-ink/90">Créer ce QR code</h3>
        {!premium.admin && <p className="text-sm font-semibold text-forest">Inclus dans Premium</p>}
      </div>
      <p className="mt-1 text-sm text-sage">
        Remplissez ces quelques champs : le QR code est créé tout de suite, en PNG et SVG.
      </p>
      <div className="mt-5">
        <CustomerFields value={customer} onChange={setCustomer} errors={errors} />
      </div>
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary mt-5 w-full sm:w-auto">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        {busy ? "Création en cours…" : "Créer mon QR code"}
      </button>
    </form>
    </AccountGate>
  );
}
