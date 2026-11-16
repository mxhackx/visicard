/**
 * APP_URL peut contenir plusieurs adresses du site, séparées par des virgules
 * (ex. `https://moncode.bj,https://visicard-wine.vercel.app`).
 * - la première est l'adresse principale : liens des QR codes, des e-mails, de la page publique ;
 * - toutes (avec et sans « www. ») sont autorisées par le CORS.
 */
const clean = (u: string) => u.trim().replace(/\/+$/, '');

export function appUrls(): string[] {
  const list = (process.env.APP_URL ?? '').split(',').map(clean).filter(Boolean);
  return list.length ? list : ['http://localhost:3000'];
}

/** L'adresse principale du site, sans barre finale. */
export function primaryAppUrl(): string {
  return appUrls()[0];
}

/** `https://moncode.bj` → `https://moncode.bj` et `https://www.moncode.bj` (sauf localhost et les domaines de déploiement). */
export function originsOf(url?: string): string[] {
  if (!url) return [];
  try {
    const u = new URL(url);
    const origin = u.origin;
    if (/^(localhost|127\.0\.0\.1)$/.test(u.hostname) || u.hostname.endsWith('.vercel.app') || u.hostname.endsWith('.onrender.com')) return [origin];
    const bare = u.hostname.replace(/^www\./, '');
    const port = u.port ? `:${u.port}` : '';
    return [`${u.protocol}//${bare}${port}`, `${u.protocol}//www.${bare}${port}`];
  } catch {
    return [];
  }
}

/** Toutes les origines web autorisées par le CORS : APP_URL (plusieurs possibles), localhost:3000 et CORS_ORIGINS. */
export function allowedOrigins(): string[] {
  return [
    ...appUrls().flatMap(originsOf),
    'http://localhost:3000',
    ...(process.env.CORS_ORIGINS ?? '').split(',').flatMap((o) => originsOf(o.trim())),
  ];
}
