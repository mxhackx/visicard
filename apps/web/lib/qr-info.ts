/** Relit le contenu d'un QR direct (Wi-Fi, appel, SMS…) pour l'afficher en clair, sans rien stocker de plus. */

export interface QrInfoRow {
  label: string;
  value: string;
  /** Lien d'action (appel, e-mail, carte…). */
  href?: string;
}

export interface QrInfo {
  kind: string;
  rows: QrInfoRow[];
}

const decode = (v: string) => {
  try {
    return decodeURIComponent(v.replace(/\+/g, " "));
  } catch {
    return v;
  }
};

const unescapeWifi = (v: string) => v.replace(/\\([\;,":])/g, "$1");

function vcardField(card: string, key: string): string {
  const m = card.match(new RegExp(`^${key}[^:\\r\\n]*:(.*)$`, "im"));
  return m ? m[1].trim() : "";
}

export function describePayload(payload: string): QrInfo {
  const p = payload.trim();

  if (/^WIFI:/i.test(p)) {
    const get = (k: string) => {
      const m = p.match(new RegExp(`(?:^WIFI:|;)${k}:((?:\\\\.|[^;])*)`, "i"));
      return m ? unescapeWifi(m[1]) : "";
    };
    const sec = get("T");
    return {
      kind: "Wi-Fi",
      rows: [
        { label: "Réseau", value: get("S") || "—" },
        { label: "Mot de passe", value: get("P") || "Aucun" },
        { label: "Sécurité", value: !sec || sec === "nopass" ? "Ouvert" : sec },
        ...(/H:true/i.test(p) ? [{ label: "Réseau", value: "Masqué" }] : []),
      ],
    };
  }
  if (/^BEGIN:VCARD/i.test(p)) {
    const tel = vcardField(p, "TEL");
    const mail = vcardField(p, "EMAIL");
    const url = vcardField(p, "URL");
    return {
      kind: "Carte de visite",
      rows: [
        { label: "Nom", value: vcardField(p, "FN") || "—" },
        ...(vcardField(p, "ORG") ? [{ label: "Entreprise", value: vcardField(p, "ORG").replace(/;/g, " ") }] : []),
        ...(vcardField(p, "TITLE") ? [{ label: "Fonction", value: vcardField(p, "TITLE") }] : []),
        ...(tel ? [{ label: "Téléphone", value: tel, href: `tel:${tel}` }] : []),
        ...(mail ? [{ label: "E-mail", value: mail, href: `mailto:${mail}` }] : []),
        ...(url ? [{ label: "Site", value: url, href: url }] : []),
      ],
    };
  }
  if (/^tel:/i.test(p)) {
    const n = p.slice(4);
    return { kind: "Appel", rows: [{ label: "Numéro", value: n, href: p }] };
  }
  if (/^sms(to)?:/i.test(p)) {
    const rest = p.replace(/^sms(to)?:/i, "");
    const [num, ...body] = rest.split(/[:?]/);
    const text = decode(body.join(":").replace(/^body=/i, ""));
    return { kind: "SMS", rows: [{ label: "Numéro", value: num }, ...(text ? [{ label: "Message", value: text }] : [])] };
  }
  if (/^mailto:/i.test(p)) {
    const [to, query = ""] = p.slice(7).split("?");
    const q = new URLSearchParams(query);
    return {
      kind: "E-mail",
      rows: [
        { label: "Destinataire", value: to, href: p },
        ...(q.get("subject") ? [{ label: "Objet", value: q.get("subject")! }] : []),
        ...(q.get("body") ? [{ label: "Message", value: q.get("body")! }] : []),
      ],
    };
  }
  if (/^geo:/i.test(p)) {
    const [lat, lng] = p.slice(4).split(/[,?]/);
    return {
      kind: "Position GPS",
      rows: [
        { label: "Latitude", value: lat },
        { label: "Longitude", value: lng },
        { label: "Voir sur la carte", value: "Ouvrir", href: `https://www.google.com/maps?q=${lat},${lng}` },
      ],
    };
  }
  if (/^BEGIN:VEVENT/i.test(p) || /^BEGIN:VCALENDAR/i.test(p)) {
    const date = (k: string) => {
      const v = vcardField(p, k);
      const m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
      return m ? `${m[3]}/${m[2]}/${m[1]}${m[4] ? ` ${m[4]}h${m[5]}` : ""}` : v;
    };
    return {
      kind: "Événement",
      rows: [
        { label: "Titre", value: vcardField(p, "SUMMARY") || "—" },
        { label: "Début", value: date("DTSTART") },
        ...(vcardField(p, "DTEND") ? [{ label: "Fin", value: date("DTEND") }] : []),
        ...(vcardField(p, "LOCATION") ? [{ label: "Lieu", value: vcardField(p, "LOCATION") }] : []),
      ],
    };
  }
  if (/^https?:\/\//i.test(p)) return { kind: "Lien", rows: [{ label: "Adresse", value: p, href: p }] };
  return { kind: "Texte", rows: [{ label: "Message", value: p }] };
}
