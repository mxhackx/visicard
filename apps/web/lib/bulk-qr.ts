import { DIRECT_QR_DEFAULTS, encodeDirectQr, type DirectQrData, type DirectQrType } from "@/lib/qr-payloads";
import { parseCsv } from "@/lib/csv";

/**
 * Génération en masse : un CSV, une ligne par QR code. La première ligne donne les colonnes : les champs du type
 * (les mêmes que dans le JSON : ssid, password…) et, en plus, `titre` (le nom du fichier et du QR code dans le compte).
 */
export const BULK_MAX = 100;

const SAMPLE: Record<DirectQrType, Record<string, string>> = {
  url: { url: "https://moncode.bj" },
  text: { text: "Bienvenue chez Moncode" },
  vcard: { firstName: "Awa", lastName: "Dossou", org: "Moncode", mobile: "+22959831293", email: "awa@moncode.bj" },
  tel: { phone: "+22959831293" },
  sms: { phone: "+22959831293", message: "Bonjour !" },
  email: { to: "contact@moncode.bj", subject: "Bonjour", body: "" },
  wifi: { ssid: "Moncode", security: "WPA", password: "motdepasse", hidden: "false" },
  event: { title: "Inauguration", start: "2026-12-05T18:00", end: "2026-12-05T21:00", location: "Cotonou", description: "" },
  geo: { lat: "6.3703", lng: "2.3912", format: "maps" },
};

const esc = (v: string) => (/[",;\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** Modèle de CSV à télécharger pour un type : en-tête et deux lignes d'exemple. */
export function bulkTemplate(type: DirectQrType): string {
  const keys = Object.keys(DIRECT_QR_DEFAULTS[type]);
  const line = (title: string) => ["titre", ...keys].map((k) => (k === "titre" ? esc(title) : esc(SAMPLE[type][k] ?? ""))).join(",");
  return `${["titre", ...keys].join(",")}\n${line("QR 1")}\n${line("QR 2")}\n`;
}

export interface BulkRow {
  /** Numéro de ligne dans le fichier (l'en-tête est la ligne 1). */
  line: number;
  title: string;
  payload: string;
  error?: string;
}

const TRUE = /^(true|1|oui|yes|vrai|x)$/i;

export function readBulk(type: DirectQrType, csv: string): { rows: BulkRow[]; fatal?: string; ignored: string[] } {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length) return { rows: [], fatal: "Le fichier est vide.", ignored: [] };
  const keys = Object.keys(DIRECT_QR_DEFAULTS[type]);
  const lower = headers.map((h) => h.toLowerCase());
  const norm = (k: string) => k.toLowerCase();
  const index = new Map<string, number>();
  keys.forEach((k) => {
    const i = lower.indexOf(norm(k));
    if (i >= 0) index.set(k, i);
  });
  const titleCol = lower.findIndex((h) => ["titre", "title", "nom", "name"].includes(h));
  // Un fichier à une seule colonne sans en-tête reconnu : la colonne est le champ principal (lien, texte, numéro).
  const MAIN: Partial<Record<DirectQrType, string>> = { url: "url", text: "text", tel: "phone" };
  let data = rows;
  if (!index.size && MAIN[type] && headers.length === 1) {
    data = [headers, ...rows];
    index.set(MAIN[type]!, 0);
  }
  if (!index.size) return { rows: [], fatal: `Aucune colonne reconnue pour « ${type} ». Colonnes attendues : ${keys.join(", ")}.`, ignored: [] };
  const ignored = headers.filter((h, i) => i !== titleCol && ![...index.values()].includes(i) && h);
  if (data.length > BULK_MAX) return { rows: [], fatal: `${data.length} lignes : ${BULK_MAX} au maximum par fichier.`, ignored };

  const out: BulkRow[] = data.map((cells, n) => {
    const d: Record<string, unknown> = { ...DIRECT_QR_DEFAULTS[type] };
    for (const [k, i] of index) {
      const v = (cells[i] ?? "").trim();
      if (typeof DIRECT_QR_DEFAULTS[type][k as never] === "boolean") d[k] = TRUE.test(v);
      else if (v) d[k] = v;
    }
    const { payload, error } = encodeDirectQr(type, d as DirectQrData[typeof type]);
    const title = (titleCol >= 0 ? (cells[titleCol] ?? "").trim() : "") || `${type}-${n + 1}`;
    return { line: n + 2 - (data === rows ? 0 : 1), title, payload, error: payload ? undefined : (error ?? "Contenu invalide.") };
  });
  return { rows: out, ignored };
}

/** Nom de fichier sûr, sans doublon. */
export function fileNames(rows: { title: string }[]): string[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const base = r.title.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "qr";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? `${base}.png` : `${base}-${n}.png`;
  });
}
