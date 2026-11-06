/**
 * QR codes « directs » (statiques) : le contenu est écrit dans le QR lui-même,
 * sans passer par une page Moncode. C'est ce qui permet au téléphone d'agir
 * sans connexion : enregistrer un contact, rejoindre un Wi-Fi, lancer un appel…
 *
 * Contrepartie : un QR direct n'est ni modifiable après impression, ni compté
 * dans les statistiques de scans. Gratuit, ouvert à tous (/qr-gratuit).
 */

export type DirectQrType = "url" | "text" | "vcard" | "tel" | "sms" | "email" | "wifi" | "event" | "geo";

export interface DirectQrData {
  url: { url: string };
  text: { text: string };
  vcard: {
    firstName: string;
    lastName: string;
    org: string;
    title: string;
    mobile: string;
    work: string;
    email: string;
    website: string;
    address: string;
  };
  tel: { phone: string };
  sms: { phone: string; message: string };
  email: { to: string; subject: string; body: string };
  wifi: { ssid: string; security: "WPA" | "WEP" | "nopass"; password: string; hidden: boolean };
  event: { title: string; start: string; end: string; location: string; description: string };
  geo: { lat: string; lng: string; format: "maps" | "geo" };
}

export const DIRECT_QR_DEFAULTS: { [K in DirectQrType]: DirectQrData[K] } = {
  url: { url: "" },
  text: { text: "" },
  vcard: { firstName: "", lastName: "", org: "", title: "", mobile: "", work: "", email: "", website: "", address: "" },
  tel: { phone: "" },
  sms: { phone: "", message: "" },
  email: { to: "", subject: "", body: "" },
  wifi: { ssid: "", security: "WPA", password: "", hidden: false },
  event: { title: "", start: "", end: "", location: "", description: "" },
  geo: { lat: "", lng: "", format: "maps" },
};

export const DIRECT_QR_TYPES: { id: DirectQrType; label: string; hint: string }[] = [
  { id: "url", label: "Lien web", hint: "Site, menu, paiement, formulaire, vidéo" },
  { id: "text", label: "Texte libre", hint: "Message, citation, code promo, instructions" },
  { id: "vcard", label: "Carte de visite", hint: "S'enregistre dans le répertoire (vCard)" },
  { id: "tel", label: "Téléphone", hint: "Lance un appel au scan" },
  { id: "sms", label: "SMS", hint: "Destinataire et message préremplis" },
  { id: "email", label: "E-mail", hint: "Destinataire, objet et corps préremplis" },
  { id: "wifi", label: "Wi-Fi", hint: "Connexion automatique au réseau" },
  { id: "event", label: "Événement", hint: "S'ajoute à l'agenda (iCal)" },
  { id: "geo", label: "Coordonnées GPS", hint: "Ouvre le lieu dans une application de carte" },
];

/** Seul le lien web est gratuit ; les autres contenus sont facturés à la commande. */
export const FREE_DIRECT_TYPES: readonly DirectQrType[] = ["url"];
export const DIRECT_QR_PRICE = 5000;
export const isFreeDirectType = (t: DirectQrType) => FREE_DIRECT_TYPES.includes(t);

export function isDirectQrType(value: unknown): value is DirectQrType {
  return DIRECT_QR_TYPES.some((t) => t.id === value);
}

/* ------------------------------------------------------------------
   Échappements propres à chaque format
------------------------------------------------------------------ */

/** vCard 3.0 / iCalendar (RFC 6350 / 5545) : \ ; , et retours à la ligne. */
const escText = (v: string) =>
  v.trim().replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Format WIFI: (ZXing) : \ ; , : et " doivent être échappés. */
const escWifi = (v: string) => v.replace(/([\\;,:"])/g, "\\$1");

/** Un numéro lisible par le composeur : chiffres et « + » de tête uniquement. */
export const cleanPhone = (v: string) => {
  const t = v.trim();
  return (t.startsWith("+") ? "+" : "") + t.replace(/\D/g, "");
};

/** Ajoute https:// si l'adresse n'a pas de schéma. */
export const normalizeUrl = (v: string) => {
  const t = v.trim();
  if (!t) return "";
  return /^[a-z][a-z0-9+.-]*:/i.test(t) ? t : `https://${t}`;
};

/** `2026-11-05T14:30` (champ datetime-local) → `20261105T143000` (heure locale). */
const icsDate = (v: string) => {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return m ? `${m[1]}${m[2]}${m[3]}T${m[4]}${m[5]}00` : "";
};

const line = (key: string, value: string) => (value ? `${key}:${value}` : null);

/* ------------------------------------------------------------------
   Contenu encodé + validation
------------------------------------------------------------------ */

export interface EncodedQr {
  /** Chaîne écrite dans le QR, ou `""` tant que le formulaire est incomplet. */
  payload: string;
  /** Ce qui manque pour que le QR soit utilisable. */
  error?: string;
}

export function encodeDirectQr<K extends DirectQrType>(type: K, data: DirectQrData[K]): EncodedQr {
  switch (type) {
    case "url": {
      const { url } = data as DirectQrData["url"];
      const href = normalizeUrl(url);
      if (!href) return { payload: "", error: "Saisissez l'adresse du lien." };
      try {
        new URL(href);
      } catch {
        return { payload: "", error: "Adresse invalide." };
      }
      return { payload: href };
    }

    case "text": {
      const { text } = data as DirectQrData["text"];
      if (!text.trim()) return { payload: "", error: "Saisissez le texte." };
      return { payload: text };
    }

    case "vcard": {
      const d = data as DirectQrData["vcard"];
      if (!d.firstName.trim() && !d.lastName.trim() && !d.org.trim()) {
        return { payload: "", error: "Saisissez au moins un nom ou une entreprise." };
      }
      const full = [d.firstName.trim(), d.lastName.trim()].filter(Boolean).join(" ") || d.org.trim();
      const lines = [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${escText(d.lastName)};${escText(d.firstName)};;;`,
        `FN:${escText(full)}`,
        line("ORG", escText(d.org)),
        line("TITLE", escText(d.title)),
        line("TEL;TYPE=CELL", cleanPhone(d.mobile)),
        line("TEL;TYPE=WORK,VOICE", cleanPhone(d.work)),
        line("EMAIL;TYPE=INTERNET", d.email.trim()),
        line("URL", normalizeUrl(d.website)),
        d.address.trim() ? `ADR;TYPE=WORK:;;${escText(d.address)};;;;` : null,
        "END:VCARD",
      ];
      return { payload: lines.filter(Boolean).join("\n") };
    }

    case "tel": {
      const phone = cleanPhone((data as DirectQrData["tel"]).phone);
      if (phone.replace("+", "").length < 4) return { payload: "", error: "Saisissez le numéro de téléphone." };
      return { payload: `tel:${phone}` };
    }

    case "sms": {
      const d = data as DirectQrData["sms"];
      const phone = cleanPhone(d.phone);
      if (phone.replace("+", "").length < 4) return { payload: "", error: "Saisissez le numéro du destinataire." };
      // SMSTO: est le format reconnu par les appareils photo iOS et Android.
      return { payload: `SMSTO:${phone}:${d.message}` };
    }

    case "email": {
      const d = data as DirectQrData["email"];
      const to = d.to.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return { payload: "", error: "Saisissez une adresse e-mail valide." };
      const params = [
        d.subject.trim() && `subject=${encodeURIComponent(d.subject.trim())}`,
        d.body.trim() && `body=${encodeURIComponent(d.body)}`,
      ].filter(Boolean);
      return { payload: `mailto:${to}${params.length ? `?${params.join("&")}` : ""}` };
    }

    case "wifi": {
      const d = data as DirectQrData["wifi"];
      if (!d.ssid) return { payload: "", error: "Saisissez le nom du réseau (SSID)." };
      if (d.security !== "nopass" && !d.password) return { payload: "", error: "Saisissez le mot de passe du réseau." };
      if (d.security === "WPA" && d.password.length < 8) {
        return { payload: "", error: "Un mot de passe WPA compte au moins 8 caractères." };
      }
      const parts = [`T:${d.security}`, `S:${escWifi(d.ssid)}`];
      if (d.security !== "nopass") parts.push(`P:${escWifi(d.password)}`);
      if (d.hidden) parts.push("H:true");
      return { payload: `WIFI:${parts.join(";")};;` };
    }

    case "event": {
      const d = data as DirectQrData["event"];
      if (!d.title.trim()) return { payload: "", error: "Saisissez le nom de l'événement." };
      const start = icsDate(d.start);
      if (!start) return { payload: "", error: "Choisissez la date et l'heure de début." };
      const end = icsDate(d.end);
      if (end && end < start) return { payload: "", error: "La fin est avant le début." };
      const lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "BEGIN:VEVENT",
        `SUMMARY:${escText(d.title)}`,
        `DTSTART:${start}`,
        line("DTEND", end),
        line("LOCATION", escText(d.location)),
        line("DESCRIPTION", escText(d.description)),
        "END:VEVENT",
        "END:VCALENDAR",
      ];
      return { payload: lines.filter(Boolean).join("\n") };
    }

    case "geo": {
      const d = data as DirectQrData["geo"];
      const lat = Number(d.lat.replace(",", "."));
      const lng = Number(d.lng.replace(",", "."));
      if (!d.lat.trim() || !d.lng.trim() || Number.isNaN(lat) || Number.isNaN(lng)) {
        return { payload: "", error: "Saisissez la latitude et la longitude." };
      }
      if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return { payload: "", error: "Coordonnées hors limites." };
      const pair = `${+lat.toFixed(6)},${+lng.toFixed(6)}`;
      // geo: ouvre l'appli de carte sur Android ; le lien Google Maps marche partout (iPhone compris).
      return { payload: d.format === "geo" ? `geo:${pair}` : `https://www.google.com/maps?q=${pair}` };
    }
  }
  return { payload: "", error: "Type inconnu." };
}

/** Au-delà, le QR devient très dense et difficile à scanner une fois imprimé petit. */
export const DENSE_PAYLOAD = 300;
