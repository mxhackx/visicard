import { API_URL } from "./api-url";

const saved = new Set<string>();

/**
 * Enregistre en base le QR code que la personne vient de créer (téléchargé), quel que soit son contenu.
 * Avec un compte, il est rattaché à son espace ; sans compte, seuls les liens sont acceptés. Une seule fois par contenu et style.
 */
export async function saveQr(payload: string, qrStyle: string, token?: string | null): Promise<void> {
  const key = `${token ? "u" : "a"}|${payload}|${qrStyle}`;
  if (saved.has(key)) return;
  saved.add(key);
  try {
    const res = await fetch(`${API_URL}/cards/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ payload, qrStyle }),
    });
    if (!res.ok) saved.delete(key);
  } catch {
    saved.delete(key);
  }
}

/**
 * « Payer » : le QR code Premium est enregistré dans l'espace du compte mais reste inaccessible (brouillon)
 * jusqu'au paiement ; le paiement le débloque. Sans jeton fourni, on reprend celui de la session.
 */
export async function saveDraftQr(payload: string, qrStyle: string, title?: string, token?: string | null): Promise<boolean> {
  let t = token ?? null;
  if (!t) {
    try {
      t = localStorage.getItem("moncode_token");
    } catch {}
  }
  if (!t) return false;
  try {
    const res = await fetch(`${API_URL}/cards/direct`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${t}` },
      body: JSON.stringify({ payload, qrStyle, title, draft: true }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
