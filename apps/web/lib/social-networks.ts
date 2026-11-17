/**
 * Réseaux sociaux proposés sous « Lien web » : le logo du réseau se place au centre du QR code, gratuitement.
 * Les logos sont des SVG intégrés (aucun appel réseau) ; `build` complète un simple identifiant (@nom) en adresse.
 */

export interface SocialNetwork {
  id: string;
  label: string;
  placeholder: string;
  /** SVG en data URL (logo du réseau) ; `null` pour un site web ordinaire. */
  logo: string | null;
  /** Transforme ce que la personne a saisi (identifiant ou adresse) en lien complet. */
  build: (value: string) => string;
}

const svg = (bg: string, inner: string, defs = "") =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="256" height="256">${defs}<rect width="64" height="64" rx="14" fill="${bg}"/>${inner}</svg>`,
  )}`;

const white = 'fill="#fff"';
const stroke = 'fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"';

const LOGOS = {
  facebook: svg("#1877F2", `<path ${white} d="M35.5 52V35h5.7l.9-6.7h-6.6v-4.3c0-1.9.6-3.3 3.3-3.3h3.5v-6c-.6-.1-2.7-.3-5.1-.3-5.1 0-8.6 3.1-8.6 8.8v5.1h-5.8V35h5.8v17z"/>`),
  instagram: svg(
    "url(#g)",
    `<rect x="17" y="17" width="30" height="30" rx="9" ${stroke} stroke-width="3.6"/><circle cx="32" cy="32" r="7" ${stroke} stroke-width="3.6"/><circle cx="41.5" cy="22.5" r="2.3" ${white}/>`,
    '<defs><linearGradient id="g" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#feda75"/><stop offset=".35" stop-color="#fa7e1e"/><stop offset=".65" stop-color="#d62976"/><stop offset="1" stop-color="#4f5bd5"/></linearGradient></defs>',
  ),
  whatsapp: svg(
    "#25D366",
    `<g transform="translate(13 13) scale(1.55)" ${stroke} stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></g><path ${white} transform="translate(24 24) scale(.68)" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`,
  ),
  tiktok: svg("#111114", `<path d="M35 15v23a7.5 7.5 0 1 1-7.5-7.5" ${stroke} stroke-width="5.2"/><path d="M35 15c.9 5.2 4.6 8.5 10 9" ${stroke} stroke-width="5.2"/>`),
  youtube: svg("#FF0000", `<rect x="11" y="18" width="42" height="28" rx="9" ${white}/><path d="M28 24.5l11 7.5-11 7.5z" fill="#FF0000"/>`),
  x: svg("#111114", `<path d="M19 17l26 30M45 17L19 47" ${stroke} stroke-width="4.6"/>`),
  linkedin: svg("#0A66C2", `<rect x="16" y="26" width="6.2" height="20" ${white}/><circle cx="19.1" cy="19.4" r="3.7" ${white}/><path ${white} d="M27.5 26h5.9v2.7c1.1-2 3.3-3.2 6-3.2 5.4 0 6.6 3.5 6.6 8.2V46h-6.2v-9.8c0-2.3 0-4.4-2.8-4.4s-3.3 2.1-3.3 4.3V46h-6.2z"/>`),
  snapchat: svg("#FFFC00", `<path d="M32 15c6 0 10 4.4 10 10.4v3.6c.9.7 2.4.9 3.6 1-.5 1.3-2 1.7-3.2 2 .4.9 1.5 2.4 3.4 3-.2.9-2.2 1.3-3.2 1.5-.5 1.1-.6 2.2-1.9 2.2-1.3 0-2.9-.6-5.7-.6s-4.4.6-5.7.6c-1.3 0-1.4-1.1-1.9-2.2-1-.2-3-.6-3.2-1.5 1.9-.6 3-2.1 3.4-3-1.2-.3-2.7-.7-3.2-2 1.2-.1 2.7-.3 3.6-1v-3.6C22 19.4 26 15 32 15z" fill="#fff" stroke="#17171a" stroke-width="2.4" stroke-linejoin="round"/>`),
  telegram: svg("#26A5E4", `<path ${white} d="M47 17.5L16.9 29.1c-1.2.5-1.2 1.2-.2 1.5l7.5 2.3 2.9 8.9c.4 1 .7 1.3 1.5.6l4.1-4 8 5.9c1.4.8 2.5.4 2.9-1.3l5-23.7c.5-2-.8-2.9-2.6-1.8z"/>`),
};

const clean = (v: string) => v.trim();
const handle = (v: string) => clean(v).replace(/^@+/, "").replace(/^\/+/, "");
const isUrl = (v: string) => /^https?:\/\//i.test(clean(v));
/** Adresse déjà complète, ou construite avec `make` à partir d'un identifiant ; vide tant que rien n'est saisi. */
const viaHandle = (make: (h: string) => string) => (v: string) => (!clean(v) ? "" : isUrl(v) ? clean(v) : make(handle(v)));

export const SOCIAL_NETWORKS: SocialNetwork[] = [
  { id: "web", label: "Site web", placeholder: "https://exemple.com/menu", logo: null, build: clean },
  { id: "facebook", label: "Facebook", placeholder: "@votrepage ou https://facebook.com/votrepage", logo: LOGOS.facebook, build: viaHandle((h) => `https://facebook.com/${h}`) },
  { id: "instagram", label: "Instagram", placeholder: "@votrecompte ou https://instagram.com/votrecompte", logo: LOGOS.instagram, build: viaHandle((h) => `https://instagram.com/${h}`) },
  { id: "whatsapp", label: "WhatsApp", placeholder: "Numéro (ex. 22901970000) ou lien wa.me", logo: LOGOS.whatsapp, build: viaHandle((h) => `https://wa.me/${h.replace(/\D/g, "")}`) },
  { id: "tiktok", label: "TikTok", placeholder: "@votrecompte ou https://tiktok.com/@votrecompte", logo: LOGOS.tiktok, build: viaHandle((h) => `https://www.tiktok.com/@${h}`) },
  { id: "youtube", label: "YouTube", placeholder: "https://youtube.com/@votrechaine", logo: LOGOS.youtube, build: viaHandle((h) => `https://youtube.com/@${h}`) },
  { id: "x", label: "X", placeholder: "@votrecompte ou https://x.com/votrecompte", logo: LOGOS.x, build: viaHandle((h) => `https://x.com/${h}`) },
  { id: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/votreprofil", logo: LOGOS.linkedin, build: viaHandle((h) => `https://www.linkedin.com/in/${h}`) },
  { id: "snapchat", label: "Snapchat", placeholder: "@votrecompte ou https://snapchat.com/add/votrecompte", logo: LOGOS.snapchat, build: viaHandle((h) => `https://snapchat.com/add/${h}`) },
  { id: "telegram", label: "Telegram", placeholder: "@votrecompte ou https://t.me/votrecompte", logo: LOGOS.telegram, build: viaHandle((h) => `https://t.me/${h}`) },
];

export const networkById = (id: string): SocialNetwork => SOCIAL_NETWORKS.find((n) => n.id === id) ?? SOCIAL_NETWORKS[0];
