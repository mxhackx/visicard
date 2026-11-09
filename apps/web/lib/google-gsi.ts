/**
 * Google Identity Services : un seul chargement du script et une seule initialisation, partagés par le
 * bouton « Continuer avec Google » et la fenêtre contextuelle (One Tap) de Chrome.
 */
export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";

export interface GoogleId {
  initialize: (o: Record<string, unknown>) => void;
  renderButton: (el: HTMLElement, o: Record<string, unknown>) => void;
  prompt: (cb?: (n: unknown) => void) => void;
  cancel: () => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

type Handler = (credential: string) => void;
const handlers: Handler[] = [];
let loading: Promise<GoogleId | null> | null = null;

/** Enregistre qui traite la réponse de Google (le dernier inscrit prévaut). Renvoie la désinscription. */
export function onGoogleCredential(h: Handler): () => void {
  handlers.push(h);
  return () => {
    const i = handlers.indexOf(h);
    if (i >= 0) handlers.splice(i, 1);
  };
}

export function loadGoogle(): Promise<GoogleId | null> {
  if (!GOOGLE_CLIENT_ID || typeof window === "undefined") return Promise.resolve(null);
  if (loading) return loading;
  loading = new Promise((resolve) => {
    const init = () => {
      const g = window.google?.accounts?.id;
      if (!g) return resolve(null);
      g.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: ({ credential }: { credential: string }) => handlers[handlers.length - 1]?.(credential),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: true,
        itp_support: true,
      });
      resolve(g);
    };
    if (window.google?.accounts?.id) return init();
    const script = Object.assign(document.createElement("script"), { src: "https://accounts.google.com/gsi/client", async: true, defer: true });
    script.dataset.gsi = "1";
    script.addEventListener("load", init);
    script.addEventListener("error", () => {
      loading = null;
      resolve(null);
    });
    document.head.appendChild(script);
  });
  return loading;
}
