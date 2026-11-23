import { DIRECT_QR_DEFAULTS, type DirectQrData, type DirectQrType } from "@/lib/qr-payloads";

/**
 * Lecture inverse de `encodeDirectQr` : retrouve le type et les champs d'un contenu déjà encodé,
 * pour le modifier dans le formulaire (compte) ou l'afficher sur la page de relais (/c/…).
 * Un contenu non reconnu est traité comme du texte libre : rien n'est jamais perdu.
 */

export type Decoded = { [K in DirectQrType]: { type: K; data: DirectQrData[K] } }[DirectQrType];

const unesc = (v: string) => v.replace(/\\n/gi, "\n").replace(/\\([\;,:"])/g, "$1");

/** Découpe sur un séparateur non échappé. */
function splitUnescaped(value: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] === "\\" && i + 1 < value.length) cur += value[i] + value[++i];
    else if (value[i] === sep) {
      out.push(cur);
      cur = "";
    } else cur += value[i];
  }
  out.push(cur);
  return out;
}

const icsToLocal = (v?: string) => {
  const m = (v ?? "").match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}` : "";
};

function lineMap(payload: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const raw of payload.split(/\r?\n/)) {
    const i = raw.indexOf(":");
    if (i > 0) map.set(raw.slice(0, i).toUpperCase(), raw.slice(i + 1));
  }
  return map;
}

export function decodeDirectQr(payload: string): Decoded {
  const p = payload.trim();

  if (/^WIFI:/i.test(p)) {
    const d = { ...DIRECT_QR_DEFAULTS.wifi };
    for (const part of splitUnescaped(p.slice(5), ";")) {
      const k = part.slice(0, 2);
      const v = unesc(part.slice(2));
      if (k === "S:") d.ssid = v;
      else if (k === "P:") d.password = v;
      else if (k === "T:") d.security = v === "WEP" ? "WEP" : v === "nopass" ? "nopass" : "WPA";
      else if (k === "H:") d.hidden = v === "true";
    }
    return { type: "wifi", data: d };
  }

  if (/^BEGIN:VCARD/i.test(p)) {
    const m = lineMap(p.replace(/TEL;TYPE=CELL/i, "TEL_CELL").replace(/TEL;TYPE=WORK,VOICE/i, "TEL_WORK").replace(/EMAIL;TYPE=INTERNET/i, "EMAIL").replace(/ADR;TYPE=WORK/i, "ADR"));
    const [last = "", first = ""] = splitUnescaped(m.get("N") ?? "", ";");
    const adr = splitUnescaped(m.get("ADR") ?? "", ";")[2] ?? "";
    return {
      type: "vcard",
      data: {
        firstName: unesc(first), lastName: unesc(last), org: unesc(m.get("ORG") ?? ""), title: unesc(m.get("TITLE") ?? ""),
        mobile: m.get("TEL_CELL") ?? "", work: m.get("TEL_WORK") ?? "", email: m.get("EMAIL") ?? "", website: m.get("URL") ?? "", address: unesc(adr),
      },
    };
  }

  if (/^BEGIN:VCALENDAR/i.test(p)) {
    const m = lineMap(p);
    return {
      type: "event",
      data: { title: unesc(m.get("SUMMARY") ?? ""), start: icsToLocal(m.get("DTSTART")), end: icsToLocal(m.get("DTEND")), location: unesc(m.get("LOCATION") ?? ""), description: unesc(m.get("DESCRIPTION") ?? "") },
    };
  }

  if (/^tel:/i.test(p)) return { type: "tel", data: { phone: p.slice(4) } };

  if (/^smsto:/i.test(p)) {
    const rest = p.slice(6);
    const i = rest.indexOf(":");
    return { type: "sms", data: { phone: i < 0 ? rest : rest.slice(0, i), message: i < 0 ? "" : rest.slice(i + 1) } };
  }

  if (/^mailto:/i.test(p)) {
    const [to, query = ""] = p.slice(7).split("?");
    const params = new URLSearchParams(query);
    return { type: "email", data: { to: decodeURIComponent(to), subject: params.get("subject") ?? "", body: params.get("body") ?? "" } };
  }

  const geo = p.match(/^geo:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/i);
  if (geo) return { type: "geo", data: { lat: geo[1], lng: geo[2], format: "geo" } };
  const maps = p.match(/^https:\/\/www\.google\.com\/maps\?q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)$/i);
  if (maps) return { type: "geo", data: { lat: maps[1], lng: maps[2], format: "maps" } };

  if (/^https?:\/\/\S+$/i.test(p)) return { type: "url", data: { url: p } };
  return { type: "text", data: { text: payload } };
}

/** Adresse sur laquelle envoyer le visiteur d'un lien de relais, ou `null` quand il faut lui montrer le contenu. */
export function relayHref(d: Decoded): string | null {
  switch (d.type) {
    case "url": return /^https?:\/\//i.test(d.data.url) ? d.data.url : null;
    case "tel": return `tel:${d.data.phone}`;
    case "sms": return `sms:${d.data.phone}${d.data.message ? `?body=${encodeURIComponent(d.data.message)}` : ""}`;
    case "email": {
      const q = [d.data.subject && `subject=${encodeURIComponent(d.data.subject)}`, d.data.body && `body=${encodeURIComponent(d.data.body)}`].filter(Boolean).join("&");
      return `mailto:${d.data.to}${q ? `?${q}` : ""}`;
    }
    case "geo": {
      const pair = `${d.data.lat},${d.data.lng}`;
      return `https://www.google.com/maps?q=${pair}`;
    }
    default: return null;
  }
}
