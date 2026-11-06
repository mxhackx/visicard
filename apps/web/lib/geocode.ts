/**
 * Recherche d'adresse automatique (OpenStreetMap Nominatim, sans clé d'API).
 * Usage léger (saisie temporisée) ; le navigateur envoie son Referer, comme l'exige la charte d'usage.
 */
export interface Place {
  /** Adresse lisible, courte. */
  label: string;
  lat: number;
  lng: number;
}

interface NominatimItem {
  display_name?: string;
  lat?: string;
  lon?: string;
  name?: string;
  address?: Record<string, string>;
}

const BASE = "https://nominatim.openstreetmap.org";

/** « Haie Vive, Cotonou, Littoral, Bénin » : on garde les 3 premiers éléments utiles. */
function shorten(item: NominatimItem): string {
  const a = item.address ?? {};
  const parts = [
    item.name && item.name !== a.city ? item.name : a.road,
    a.neighbourhood || a.suburb || a.quarter,
    a.city || a.town || a.village || a.municipality,
    a.country,
  ].filter((p): p is string => Boolean(p));
  const unique = parts.filter((p, i) => parts.indexOf(p) === i);
  return unique.length >= 2 ? unique.join(", ") : (item.display_name ?? "").split(",").slice(0, 3).join(",").trim();
}

function toPlace(item: NominatimItem): Place | null {
  const lat = Number(item.lat);
  const lng = Number(item.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { label: shorten(item), lat, lng };
}

export async function searchPlaces(query: string, signal?: AbortSignal): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${BASE}/search?format=jsonv2&addressdetails=1&limit=5&accept-language=fr&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error("Recherche d’adresse indisponible.");
  const items = (await res.json()) as NominatimItem[];
  return items.map(toPlace).filter((p): p is Place => p !== null);
}

export async function reversePlace(lat: number, lng: number, signal?: AbortSignal): Promise<Place | null> {
  const url = `${BASE}/reverse?format=jsonv2&addressdetails=1&zoom=18&accept-language=fr&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!res.ok) return null;
  const item = (await res.json()) as NominatimItem;
  const place = toPlace({ ...item, lat: String(lat), lon: String(lng) });
  return place && place.label ? place : null;
}

/** Lien Google Maps (ouvert par « Itinéraire ») pour des coordonnées. */
export const mapsLink = (lat: number, lng: number) => `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
