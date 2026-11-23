import { DIRECT_QR_DEFAULTS, isDirectQrType, type DirectQrData, type DirectQrType } from "@/lib/qr-payloads";
import { DEFAULT_QR_STYLE, parseQrStyle, serializeQrStyle } from "@/lib/qr-style";
import { LAYOUT_OPTIONS } from "@/lib/layouts";
import { SECTORS } from "@/lib/sectors";
import { LIMITS, isHttpUrl, normalizeUrl } from "@/lib/validation";
import { serializeMenuModel, type MenuSection } from "@/lib/menu-lines";
import type { RestaurantInfo } from "@/app/context/FileContext";

/**
 * Création à partir d'un fichier JSON, pour un QR code ou une page digitale.
 * Tout est validé ici : le résultat est sûr à appliquer tel quel, ou une liste d'erreurs lisibles est renvoyée.
 * Les images (logo, photos) ne passent pas par le JSON : elles s'ajoutent ensuite dans le formulaire.
 */

export type QrImport = { kind: "qr"; type: DirectQrType; data: DirectQrData[DirectQrType]; style?: string };
export type PageImport = {
  kind: "page";
  sector?: string;
  layout?: string;
  info: Partial<RestaurantInfo>;
  qrStyle?: string;
};
export type ImportResult =
  | { ok: true; value: QrImport | PageImport; warnings: string[] }
  | { ok: false; errors: string[] };

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAYS_FR: Record<string, (typeof DAYS)[number]> = {
  lundi: "monday", mardi: "tuesday", mercredi: "wednesday", jeudi: "thursday", vendredi: "friday", samedi: "saturday", dimanche: "sunday",
};
const text = (v: unknown) => (typeof v === "string" ? v : typeof v === "number" ? String(v) : undefined);

/** Style du QR code : un objet partiel, complété par les valeurs par défaut ; les valeurs inconnues sont signalées. */
function readStyle(raw: unknown, warnings: string[]): string | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) {
    warnings.push("« style » doit être un objet : ignoré.");
    return undefined;
  }
  const style = parseQrStyle(JSON.stringify({ ...DEFAULT_QR_STYLE, ...raw }));
  const wanted = (k: string) => raw[k] !== undefined && String(raw[k]).toLowerCase() !== String(style[k as keyof typeof style]).toLowerCase();
  for (const k of ["fg", "bg", "dots", "corners", "cornerDots"]) if (wanted(k)) warnings.push(`style.${k} : valeur « ${String(raw[k])} » non reconnue, remplacée par « ${String(style[k as keyof typeof style])} ».`);
  return serializeQrStyle(style);
}

function readQr(obj: Obj, type: DirectQrType, warnings: string[]): ImportResult {
  const errors: string[] = [];
  const defaults = DIRECT_QR_DEFAULTS[type] as Record<string, unknown>;
  // « data » est l'écriture complète ; pour un lien ou un texte, les champs peuvent aussi être à la racine.
  const source = isObj(obj.data) ? obj.data : obj;
  const data: Obj = { ...defaults };
  for (const key of Object.keys(defaults)) {
    const v = source[key];
    if (v === undefined) continue;
    if (typeof defaults[key] === "boolean") {
      if (typeof v === "boolean") data[key] = v;
      else errors.push(`data.${key} doit valoir true ou false.`);
    } else {
      const s = text(v);
      if (s === undefined) errors.push(`data.${key} doit être un texte.`);
      else data[key] = s;
    }
  }
  if (isObj(obj.data)) {
    for (const key of Object.keys(obj.data)) if (!(key in defaults)) warnings.push(`data.${key} : champ inconnu pour « ${type} », ignoré.`);
  }
  if (type === "wifi" && !["WPA", "WEP", "nopass"].includes(String(data.security))) errors.push("data.security : « WPA », « WEP » ou « nopass ».");
  if (type === "geo" && !["maps", "geo"].includes(String(data.format))) errors.push("data.format : « maps » ou « geo ».");
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { kind: "qr", type, data: data as DirectQrData[DirectQrType], style: readStyle(obj.style, warnings) }, warnings };
}

function readSchedule(raw: unknown, errors: string[]): RestaurantInfo["schedule"] | undefined {
  if (raw === undefined) return undefined;
  if (!isObj(raw)) {
    errors.push("« schedule » doit être un objet (monday à sunday).");
    return undefined;
  }
  const out: RestaurantInfo["schedule"] = {} as RestaurantInfo["schedule"];
  for (const [name, v] of Object.entries(raw)) {
    const day = (DAYS as readonly string[]).includes(name) ? (name as (typeof DAYS)[number]) : DAYS_FR[name.toLowerCase()];
    if (!day) {
      errors.push(`schedule.${name} : jour inconnu (monday… sunday).`);
      continue;
    }
    if (v === false) out[day] = { isOpen: false, open: "09:00", close: "18:00" };
    else if (isObj(v) && HHMM.test(String(v.open)) && HHMM.test(String(v.close))) out[day] = { isOpen: v.isOpen !== false, open: String(v.open), close: String(v.close) };
    else errors.push(`schedule.${name} : attendu false (fermé) ou { "open": "09:00", "close": "22:00" }.`);
  }
  return out;
}

function readPage(obj: Obj, warnings: string[]): ImportResult {
  const errors: string[] = [];
  const info: Partial<RestaurantInfo> = {};

  const str = (key: string, field: keyof RestaurantInfo, max: number) => {
    const v = obj[key];
    if (v === undefined) return;
    const s = text(v);
    if (s === undefined) return void errors.push(`« ${key} » doit être un texte.`);
    if (s.length > max) return void errors.push(`« ${key} » : ${max} caractères au maximum.`);
    (info as Obj)[field] = s.trim();
  };
  const url = (key: string, field: keyof RestaurantInfo) => {
    const v = obj[key];
    if (v === undefined || v === "") return;
    const s = text(v) !== undefined ? normalizeUrl(String(v)) : "";
    if (!isHttpUrl(s)) return void errors.push(`« ${key} » doit être une adresse web (https://…).`);
    (info as Obj)[field] = s;
  };

  str("name", "restaurantName", LIMITS.name);
  str("address", "address", LIMITS.address);
  url("locationUrl", "locationUrl");
  url("facebook", "facebookUrl");
  url("instagram", "instagramUrl");
  url("x", "xUrl");
  url("snapchat", "snapchatUrl");
  if (obj.phone !== undefined) {
    const p = (text(obj.phone) ?? "").replace(/[\s.()-]/g, "");
    if (!/^\+\d{8,15}$/.test(p)) errors.push("« phone » : numéro avec indicatif, par exemple +22959831293.");
    else info.phoneNumber = p;
  }

  // Menu : « info » (texte libre) l'emporte ; sinon accroche, atouts et catégories sont assemblés.
  if (obj.info !== undefined) {
    str("info", "additionalInfo", LIMITS.info);
  } else if (obj.tagline !== undefined || obj.tags !== undefined || obj.menu !== undefined) {
    const sections: MenuSection[] = [];
    if (obj.menu !== undefined && !Array.isArray(obj.menu)) errors.push("« menu » doit être une liste de catégories.");
    for (const [i, c] of (Array.isArray(obj.menu) ? obj.menu : []).entries()) {
      if (!isObj(c) || !text(c.category) || !Array.isArray(c.items)) {
        errors.push(`menu[${i}] : attendu { "category": "…", "items": [{ "name": "…", "price": 1500 }] }.`);
        continue;
      }
      const dishes = [];
      for (const [k, d] of c.items.entries()) {
        const price = isObj(d) ? String(d.price ?? "").replace(/\D/g, "") : "";
        if (!isObj(d) || !text(d.name)?.trim() || !price) errors.push(`menu[${i}].items[${k}] : « name » et « price » (en FCFA, chiffres) sont requis.`);
        else dishes.push({ name: String(d.name).trim(), price });
      }
      sections.push({ title: String(c.category).trim(), dishes });
    }
    const tags = Array.isArray(obj.tags) ? obj.tags.map((t) => text(t)?.trim() ?? "").filter(Boolean) : [];
    if (obj.tags !== undefined && !Array.isArray(obj.tags)) errors.push("« tags » doit être une liste de textes.");
    const joined = serializeMenuModel({ tagline: text(obj.tagline) ?? "", tags, sections });
    if (joined.length > LIMITS.info) errors.push(`Le menu dépasse ${LIMITS.info} caractères.`);
    else info.additionalInfo = joined;
  }

  const schedule = readSchedule(obj.schedule, errors);
  if (schedule) info.schedule = schedule;

  let sector: string | undefined;
  if (obj.sector !== undefined) {
    if (SECTORS.some((s) => s.id === obj.sector)) sector = String(obj.sector);
    else errors.push(`« sector » : ${SECTORS.map((s) => s.id).join(", ")}.`);
  }
  let layout: string | undefined;
  if (obj.layout !== undefined) {
    if (LAYOUT_OPTIONS.some((l) => l.id === obj.layout)) layout = String(obj.layout);
    else errors.push(`« layout » : ${LAYOUT_OPTIONS.map((l) => l.id).join(", ")}.`);
  }

  const known = ["type", "sector", "layout", "name", "address", "locationUrl", "phone", "facebook", "instagram", "x", "snapchat", "info", "tagline", "tags", "menu", "schedule", "style", "qrStyle"];
  for (const k of Object.keys(obj)) if (!known.includes(k)) warnings.push(`« ${k} » : champ inconnu, ignoré.`);
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { kind: "page", sector, layout, info, qrStyle: readStyle(obj.qrStyle ?? obj.style, warnings) }, warnings };
}

export function parseImport(raw: string): ImportResult {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { ok: false, errors: [`JSON invalide : ${e instanceof Error ? e.message : "lecture impossible"}.`] };
  }
  if (!isObj(json)) return { ok: false, errors: ["Le fichier doit contenir un objet JSON { … }."] };
  const type = json.type;
  const warnings: string[] = [];
  if (type === "page") return readPage(json, warnings);
  if (isDirectQrType(type)) return readQr(json, type, warnings);
  return { ok: false, errors: [`« type » est requis : ${["page", "url", "text", "vcard", "tel", "sms", "email", "wifi", "event", "geo"].join(", ")}.`] };
}

/** Modèle à télécharger : un exemple complet et valide pour le contenu en cours. */
export function templateFor(type: DirectQrType | "page"): string {
  const style = { fg: "#111827", bg: "#ffffff", dots: "rounded", corners: "extra-rounded", cornerDots: "dot" };
  if (type === "page") {
    return JSON.stringify({
      type: "page",
      sector: "restaurant",
      layout: "annuaire",
      name: "Chez Moncode",
      address: "Avenue Steinmetz, Cotonou",
      locationUrl: "https://maps.google.com/?q=Cotonou",
      phone: "+22959831293",
      instagram: "https://instagram.com/moncode",
      tagline: "Cuisine béninoise et grillades",
      tags: ["wifi", "terrasse", "livraison"],
      menu: [
        { category: "Plats", items: [{ name: "Poulet braisé", price: 2500 }, { name: "Riz au gras", price: 1500 }] },
        { category: "Boissons", items: [{ name: "Jus de bissap", price: 500 }] },
      ],
      schedule: { monday: { open: "09:00", close: "22:00" }, sunday: false },
      qrStyle: style,
    }, null, 2);
  }
  const data = { ...DIRECT_QR_DEFAULTS[type] } as Record<string, unknown>;
  const sample: Partial<Record<DirectQrType, Record<string, unknown>>> = {
    url: { url: "https://moncode.bj" },
    text: { text: "Bienvenue chez Moncode" },
    vcard: { firstName: "Awa", lastName: "Dossou", org: "Moncode", mobile: "+22959831293", email: "awa@moncode.bj" },
    tel: { phone: "+22959831293" },
    sms: { phone: "+22959831293", message: "Bonjour !" },
    email: { to: "contact@moncode.bj", subject: "Bonjour", body: "" },
    wifi: { ssid: "Moncode", security: "WPA", password: "motdepasse" },
    event: { title: "Inauguration", start: "2026-12-05T18:00", end: "2026-12-05T21:00", location: "Cotonou" },
    geo: { lat: "6.3703", lng: "2.3912", format: "maps" },
  };
  return JSON.stringify({ type, data: { ...data, ...sample[type] }, style }, null, 2);
}
