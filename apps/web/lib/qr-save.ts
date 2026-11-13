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
