import { API_URL } from "./api-url";

export interface ContactDraft {
  name: string;
  business: string;
  email: string;
  phone: string;
  kind: string;
  message: string;
  /** Champ piège invisible : seuls les robots le remplissent. */
  website?: string;
}

/** Envoie le message du formulaire de contact à l'équipe (par e-mail, côté serveur). Lève une erreur lisible en cas d'échec. */
export async function sendContact(draft: ContactDraft): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/contact`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
  } catch {
    throw new Error("Impossible de joindre le serveur. Vérifiez votre connexion, puis réessayez.");
  }
  if (res.ok) return;
  const data = await res.json().catch(() => ({}));
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  if (res.status === 429) throw new Error("Trop de messages envoyés : patientez une minute avant de réessayer.");
  throw new Error(typeof message === "string" ? message : "L’envoi a échoué. Réessayez.");
}
