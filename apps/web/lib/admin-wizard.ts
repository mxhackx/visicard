/**
 * Le parcours admin « Nouveau QR code » : quatre étapes réelles
 * (Service → Client → Contenu → Design & QR).
 *
 * Le brouillon (textes, coordonnées, couleurs) est stocké dans `localStorage`,
 * l'étape courante et le service dans l'URL : `/admin/nouveau?service=page&etape=3`.
 * Les fichiers choisis (logo, photos, média, PDF) restent en mémoire : un
 * rechargement de l'onglet conserve les textes mais laisse les champs de dépôt
 * vides, ce que l'écran 4 signale.
 */
import {
  PAGE_DEFAULTS,
  PAGE_PALETTES,
  coordsFromUrl,
  encodeThemeId,
  formatTel,
  type PageContent,
  type Palette,
} from "./page-design";
import { SERVICES, type ServiceType } from "./services";

export const WIZARD_STEPS = [
  { id: 1, label: "Service", hint: "Ce que vous créez" },
  { id: 2, label: "Client", hint: "À qui la commande est adressée" },
  { id: 3, label: "Contenu", hint: "Textes, contact et fichiers" },
  { id: 4, label: "Design & QR", hint: "Couleurs, aperçu et publication" },
] as const;

export type WizardStepId = (typeof WIZARD_STEPS)[number]["id"];

export interface WizardCustomer {
  name: string;
  phone: string;
  email: string;
}

export type Schedule = Record<string, { isOpen: boolean; open: string; close: string }>;

export interface WizardPage {
  restaurantName: string;
  address: string;
  locationUrl: string;
  phoneNumber: string;
  facebookUrl: string;
  instagramUrl: string;
  xUrl: string;
  snapchatUrl: string;
  additionalInfo: string;
  schedule: Schedule;
}

/** Les visuels et médias, gardés en mémoire pendant la session. */
export interface WizardFiles {
  logo: File | null;
  logoPreview: string | null;
  gallery: File[];
  galleryPreviews: string[];
  media: File | null;
  mediaPreview: string | null;
  document: File | null;
}

export const emptyFiles: WizardFiles = {
  logo: null,
  logoPreview: null,
  gallery: [],
  galleryPreviews: [],
  media: null,
  mediaPreview: null,
  document: null,
};

export interface WizardDesign {
  /** Identifiant d'une palette prête, ou `"custom"`. */
  paletteId: string;
  custom: { brand: string; accent: string; surface: string; text: string };
  brandName: string;
  signature: string;
  headline: string;
  lede: string;
  ctaPrimaire: string;
  ctaSecondaire: string;
  titreGalerie: string;
  ledeGalerie: string;
  titreContact: string;
  ledeContact: string;
  messageWa: string;
  /** Index de l'image de galerie affichée en grand dans le hero. */
  heroIndex: number;
  /** Nom visible (légende) de chaque image de galerie, dans le même ordre. */
  captions: string[];
  logoAlt: string;
}

export interface WizardDraft {
  service: ServiceType;
  etape: WizardStepId;
  client: WizardCustomer;
  page: WizardPage;
  /** Titre d'un média ou d'un document. */
  title: string;
  design: WizardDesign;
  qrName: string;
}

const DEFAULT_SCHEDULE: Schedule = {
  monday: { isOpen: true, open: "09:00", close: "22:00" },
  tuesday: { isOpen: true, open: "09:00", close: "22:00" },
  wednesday: { isOpen: true, open: "09:00", close: "22:00" },
  thursday: { isOpen: true, open: "09:00", close: "22:00" },
  friday: { isOpen: true, open: "09:00", close: "23:00" },
  saturday: { isOpen: true, open: "10:00", close: "23:00" },
  sunday: { isOpen: false, open: "10:00", close: "15:00" },
};

export const emptyPage: WizardPage = {
  restaurantName: "",
  address: "",
  locationUrl: "",
  phoneNumber: "",
  facebookUrl: "",
  instagramUrl: "",
  xUrl: "",
  snapchatUrl: "",
  additionalInfo: "",
  schedule: DEFAULT_SCHEDULE,
};

export function emptyDraft(service: ServiceType = "page"): WizardDraft {
  return {
    service,
    etape: 1,
    client: { name: "", phone: "", email: "" },
    page: { ...emptyPage, schedule: DEFAULT_SCHEDULE },
    title: "",
    design: {
      paletteId: "exoticas-vert",
      custom: { brand: "#466931", accent: "#6EA03F", surface: "#F7F6F1", text: "#22331B" },
      brandName: "",
      signature: PAGE_DEFAULTS.signature,
      headline: "",
      lede: "",
      ctaPrimaire: PAGE_DEFAULTS.ctaPrimaire,
      ctaSecondaire: PAGE_DEFAULTS.ctaSecondaire,
      titreGalerie: PAGE_DEFAULTS.titreGalerie,
      ledeGalerie: PAGE_DEFAULTS.ledeGalerie,
      titreContact: PAGE_DEFAULTS.titreContact,
      ledeContact: PAGE_DEFAULTS.ledeContact,
      messageWa: PAGE_DEFAULTS.messageWa,
      heroIndex: 0,
      captions: [],
      logoAlt: "",
    },
    qrName: "",
  };
}

/* ------------------------------------------------------------------
   Brouillon : localStorage
------------------------------------------------------------------ */

const DRAFT_KEY = "moncode:admin:nouveau:brouillon";

/** Fusion prudente : un brouillon plus ancien ne doit jamais casser l'écran. */
export function loadDraft(): WizardDraft {
  const base = emptyDraft();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    if (!raw) return base;
    const saved = JSON.parse(raw) as Partial<WizardDraft>;
    return {
      ...base,
      ...saved,
      service: saved.service === "media" || saved.service === "document" ? saved.service : "page",
      etape: isStep(saved.etape) ? saved.etape : 1,
      client: { ...base.client, ...(saved.client ?? {}) },
      page: { ...base.page, ...(saved.page ?? {}), schedule: saved.page?.schedule ?? DEFAULT_SCHEDULE },
      design: { ...base.design, ...(saved.design ?? {}) },
    };
  } catch {
    return base;
  }
}

export function saveDraft(draft: WizardDraft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* disque plein ou navigation privée : l'URL porte quand même l'étape */
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* rien à nettoyer */
  }
}

export function isStep(value: unknown): value is WizardStepId {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

/** Indicatifs utiles pour Mobile Money et les liens WhatsApp. */
export const COUNTRY_CODES = [
  { code: "+229", label: "🇧🇯 +229" },
  { code: "+33", label: "🇫🇷 +33" },
  { code: "+225", label: "🇨🇮 +225" },
  { code: "+221", label: "🇸🇳 +221" },
  { code: "+228", label: "🇹🇬 +228" },
  { code: "+237", label: "🇨🇲 +237" },
  { code: "+243", label: "🇨🇩 +243" },
  { code: "+241", label: "🇬🇦 +241" },
  { code: "+226", label: "🇧🇫 +226" },
  { code: "+1", label: "🇺🇸/🇨🇦 +1" },
  { code: "+44", label: "🇬🇧 +44" },
];

/** Un numéro en deux parties (indicatif + numéro local) → E.164 sans espaces. */
export function splitPhone(phone: string, codes = COUNTRY_CODES): { code: string; local: string } {
  const clean = phone.replace(/\s+/g, "");
  const matched = codes.find((c) => clean.startsWith(c.code));
  return matched ? { code: matched.code, local: clean.slice(matched.code.length) } : { code: "+229", local: clean };
}

export function joinPhone(code: string, local: string) {
  return `${code}${local.replace(/\s+/g, "")}`;
}

export function wizardHref(service: ServiceType, etape: WizardStepId) {
  return `/admin/nouveau?service=${service}&etape=${etape}`;
}

/* ------------------------------------------------------------------
   Palette, contenu, formulaires
------------------------------------------------------------------ */

export function designPalette(design: WizardDesign): Palette {
  if (design.paletteId === "custom") return { id: "custom", name: "Personnalisée", ...design.custom };
  return PAGE_PALETTES.find((p) => p.id === design.paletteId) ?? PAGE_PALETTES[0];
}

export function themeIdOf(design: WizardDesign): string {
  return encodeThemeId(designPalette(design));
}

/** Ce que l'API accepte : le thème encode la palette dans `themeId`. */
export function contentFields(draft: WizardDraft): Record<string, string> {
  const { page, design, service, title } = draft;
  const common: Record<string, string> = {
    serviceType: service,
    themeId: themeIdOf(design),
    cardLayout: "exo",
  };
  if (service !== "page") {
    return { ...common, title: title.trim() || "Contenu Moncode" };
  }
  return {
    ...common,
    restaurantName: page.restaurantName.trim(),
    address: page.address.trim(),
    locationUrl: page.locationUrl.trim(),
    phoneNumber: page.phoneNumber.trim(),
    ...(page.facebookUrl.trim() && { facebookUrl: page.facebookUrl.trim() }),
    ...(page.instagramUrl.trim() && { instagramUrl: page.instagramUrl.trim() }),
    ...(page.xUrl.trim() && { xUrl: page.xUrl.trim() }),
    ...(page.snapchatUrl.trim() && { snapchatUrl: page.snapchatUrl.trim() }),
    ...(page.additionalInfo.trim() && { additionalInfo: page.additionalInfo.trim() }),
    schedule: JSON.stringify(page.schedule),
  };
}

export function appendFiles(body: FormData, files: WizardFiles, service: ServiceType) {
  if (service === "media" && files.media) body.append("media", files.media);
  if (service === "document" && files.document) body.append("document", files.document);
  if (service !== "page") return;
  if (files.logo) body.append("logo", files.logo);
  files.gallery.forEach((f) => body.append("menu", f));
}

/** Devis à régler par le client (Fedapay / MoMo), sans compte. */
export function quoteFormData(draft: WizardDraft, files: WizardFiles): FormData {
  const body = new FormData();
  for (const [k, v] of Object.entries(contentFields(draft))) body.append(k, v);
  body.append("customerName", draft.client.name.trim());
  body.append("customerPhone", draft.client.phone.trim());
  if (draft.client.email.trim()) body.append("customerEmail", draft.client.email.trim());
  appendFiles(body, files, draft.service);
  return body;
}

/** Publication immédiate côté admin : QR actif, aucun paiement. */
export function cardFormData(draft: WizardDraft, files: WizardFiles): FormData {
  const body = new FormData();
  for (const [k, v] of Object.entries(contentFields(draft))) body.append(k, v);
  body.append("clientName", draft.client.name.trim());
  appendFiles(body, files, draft.service);
  return body;
}

/**
 * La page rendue par `<DigitalPage>` : les champs fonctionnels (nom, téléphone,
 * adresse, réseaux) viennent du contenu, les textes de marque du design.
 */
export function pageContentOf(draft: WizardDraft, files: WizardFiles): PageContent {
  const { page, design } = draft;
  const coords = coordsFromUrl(page.locationUrl);
  const nom = (design.brandName || page.restaurantName).trim();
  const gallery = files.galleryPreviews.map((src, i) => ({ src, caption: design.captions[i] ?? "" }));
  const hero = gallery.length ? gallery[Math.min(design.heroIndex, gallery.length - 1)].src : null;

  const reseaux = [
    { label: "Facebook", url: page.facebookUrl },
    { label: "Instagram", url: page.instagramUrl },
    { label: "X", url: page.xUrl },
    { label: "Snapchat", url: page.snapchatUrl },
  ].filter((r) => r.url.trim());

  return {
    brandName: nom,
    signature: design.signature.trim(),
    headline: design.headline.trim() || "Donnons vie à votre espace.",
    lede: design.lede.trim() || page.address.trim(),
    adresseCourte: page.address.trim(),
    adresseLongue: page.additionalInfo.trim(),
    tel: formatTel(page.phoneNumber),
    whatsapp: page.phoneNumber.replace(/\D/g, ""),
    email: draft.client.email.trim(),
    horaires: horairesEnTexte(page.schedule),
    messageWa: design.messageWa.trim() || PAGE_DEFAULTS.messageWa,
    titreGalerie: design.titreGalerie.trim() || PAGE_DEFAULTS.titreGalerie,
    ledeGalerie: design.ledeGalerie.trim(),
    titreContact: design.titreContact.trim() || PAGE_DEFAULTS.titreContact,
    ledeContact: design.ledeContact.trim() || PAGE_DEFAULTS.ledeContact,
    ctaPrimaire: design.ctaPrimaire.trim() || PAGE_DEFAULTS.ctaPrimaire,
    ctaSecondaire: design.ctaSecondaire.trim() || PAGE_DEFAULTS.ctaSecondaire,
    logoUrl: files.logoPreview ?? "",
    heroImageUrl: hero ?? files.logoPreview ?? "",
    gallery,
    reseaux,
    lat: coords?.lat ?? null,
    lng: coords?.lng ?? null,
  };
}

const JOURS: [string, string][] = [
  ["monday", "Lundi"],
  ["tuesday", "Mardi"],
  ["wednesday", "Mercredi"],
  ["thursday", "Jeudi"],
  ["friday", "Vendredi"],
  ["saturday", "Samedi"],
  ["sunday", "Dimanche"],
];

/** Horaires en une ligne lisible : « Lun – Sam : 09:00 – 22:00 », sinon jour par jour. */
export function horairesEnTexte(schedule: Schedule): string {
  const actifs = JOURS.filter(([k]) => schedule[k]?.isOpen);
  if (actifs.length === 0) return "";
  const premiere = schedule[actifs[0][0]];
  const identique = actifs.every(([k]) => schedule[k].open === premiere.open && schedule[k].close === premiere.close);
  if (identique && actifs.length >= 4) {
    const debut = actifs[0][1].slice(0, 3);
    const fin = actifs[actifs.length - 1][1].slice(0, 3);
    return `${debut} – ${fin} : ${premiere.open} – ${premiere.close}`;
  }
  return actifs.map(([k, nom]) => `${nom.slice(0, 3)} ${schedule[k].open}–${schedule[k].close}`).join(" · ");
}

/* ------------------------------------------------------------------
   Messages au client : WhatsApp et e-mail pré-remplis
------------------------------------------------------------------ */

export interface PublishResult {
  mode: "card" | "quote";
  reference?: string;
  accessToken?: string;
  slug?: string;
  cardUrl?: string;
  qrCode?: string;
  amount?: number;
  quoteNumber?: string;
}

export interface ShareMessages {
  whatsappHref: string;
  mailHref: string;
}

const prix = (id: ServiceType) => SERVICES.find((s) => s.id === id)?.price ?? "5 000";

/** Textes prêts à envoyer : rien n'est expédié, l'admin ouvre WhatsApp ou sa messagerie. */
export function shareMessages(draft: WizardDraft, res: PublishResult, privateLink?: string): ShareMessages {
  const nom = draft.client.name.trim() || "vous";
  const etablissement = draft.design.brandName || draft.page.restaurantName || draft.title || "votre contenu";
  const serviceLabel = SERVICES.find((s) => s.id === draft.service)?.name ?? "QR code";

  const sujetTitre =
    res.mode === "card" ? `Votre ${serviceLabel.toLowerCase()} est en ligne` : `Votre devis Moncode ${res.quoteNumber ?? ""}`.trim();

  const corps =
    res.mode === "card"
      ? `Bonjour ${nom},\n\nVotre ${serviceLabel.toLowerCase()} « ${etablissement} » est créé et actif.\nLien : ${res.cardUrl ?? "—"}\nVous pouvez déjà l'imprimer ou le partager.\n\n— Moncode`
      : `Bonjour ${nom},\n\nVoici votre devis ${res.quoteNumber ?? ""} pour « ${etablissement} » (${serviceLabel}) : ${prix(draft.service)} FCFA.\nRéglez en une fois par Mobile Money ou carte ici : ${privateLink ?? "—"}\nLe QR code s'active dès le paiement confirmé.\n\n— Moncode`;

  const waNumero = draft.client.phone.replace(/\D/g, "");
  const objet = encodeURIComponent(sujetTitre);
  const texte = encodeURIComponent(corps);

  return {
    whatsappHref: waNumero ? `https://wa.me/${waNumero}?text=${texte}` : `https://wa.me/?text=${texte}`,
    mailHref: `mailto:${encodeURIComponent(draft.client.email.trim())}?subject=${objet}&body=${texte}`,
  };
}

/** Le lien privé à transmettre au client (jamais envoyé à l'API). */
export function privateQuoteLink(reference: string, accessToken: string): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/commande/${reference}?cle=${encodeURIComponent(accessToken)}`;
}
