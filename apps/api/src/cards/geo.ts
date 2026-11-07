/** Localisation approximative d'un scan, sans adresse IP : en-têtes de l'hébergeur, sinon fuseau et langue du visiteur. */

const TZ: Record<string, { country: string; city?: string }> = {
  'Africa/Porto-Novo': { country: 'BJ', city: 'Porto-Novo' },
  'Africa/Abidjan': { country: 'CI', city: 'Abidjan' },
  'Africa/Dakar': { country: 'SN', city: 'Dakar' },
  'Africa/Ouagadougou': { country: 'BF', city: 'Ouagadougou' },
  'Africa/Lome': { country: 'TG', city: 'Lomé' },
  'Africa/Accra': { country: 'GH', city: 'Accra' },
  'Africa/Bamako': { country: 'ML', city: 'Bamako' },
  'Africa/Niamey': { country: 'NE', city: 'Niamey' },
  'Africa/Conakry': { country: 'GN', city: 'Conakry' },
  'Africa/Douala': { country: 'CM', city: 'Douala' },
  'Africa/Libreville': { country: 'GA', city: 'Libreville' },
  'Africa/Brazzaville': { country: 'CG', city: 'Brazzaville' },
  'Africa/Kinshasa': { country: 'CD', city: 'Kinshasa' },
  'Africa/Lagos': { country: 'NG' },
  'Africa/Casablanca': { country: 'MA', city: 'Casablanca' },
  'Africa/Tunis': { country: 'TN', city: 'Tunis' },
  'Africa/Algiers': { country: 'DZ', city: 'Alger' },
  'Europe/Paris': { country: 'FR', city: 'Paris' },
  'Europe/Brussels': { country: 'BE', city: 'Bruxelles' },
  'America/Toronto': { country: 'CA', city: 'Toronto' },
  'America/Montreal': { country: 'CA', city: 'Montréal' },
};

const clean = (v: unknown, max = 60) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export interface ScanGeo {
  country: string | null;
  city: string | null;
}

export function resolveGeo(headers: Record<string, string | string[] | undefined>, tz?: unknown, lang?: unknown): ScanGeo {
  const h = (k: string) => {
    const v = headers[k];
    return clean(Array.isArray(v) ? v[0] : v, 80);
  };
  let country = (h('x-vercel-ip-country') || h('cf-ipcountry') || h('x-country-code')).toUpperCase();
  let city = h('x-vercel-ip-city') || h('cf-ipcity');
  try {
    city = decodeURIComponent(city);
  } catch {
    /* garde la valeur brute */
  }
  if (!/^[A-Z]{2}$/.test(country) || country === 'XX') country = '';

  const zone = TZ[clean(tz, 40)];
  if (!country) {
    const region = clean(lang, 15).match(/^[a-z]{2,3}[-_]([A-Za-z]{2})$/)?.[1]?.toUpperCase();
    country = region || zone?.country || '';
  }
  // La ville n'est lue que dans les en-têtes de l'hébergeur : un fuseau horaire désigne une région, pas une ville.
  return { country: country || null, city: city ? city.slice(0, 60) : null };
}

export function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['fr'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}
