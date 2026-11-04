/**
 * Parcours de création d'une page digitale.
 *  - client : sans compte. Informations → Apparence → Validation (devis, puis paiement).
 *  - admin  : Intervention → Informations → Apparence → QR code (actif tout de suite, sans paiement).
 */
export type BuilderMode = "client" | "admin";

export interface BuilderFlow {
  requiresAdmin: boolean;
  loginHref: string;
  informations: { back: string; backLabel: string; next: string; step: string };
  apparence: { back: string; next: string; nextLabel: string; step: string };
}

export const BUILDER_FLOWS: Record<BuilderMode, BuilderFlow> = {
  client: {
    requiresAdmin: false,
    loginHref: "/admin/connexion",
    informations: {
      back: "/creer",
      backLabel: "Choix du service",
      next: "/creer/page/apparence",
      step: "Étape 1 sur 3",
    },
    apparence: {
      back: "/creer/page/informations",
      next: "/creer/page/validation",
      nextLabel: "Suivant : devis",
      step: "Étape 2 sur 3",
    },
  },
  admin: {
    requiresAdmin: true,
    loginHref: "/admin/connexion",
    informations: {
      back: "/admin/nouveau/page",
      backLabel: "Intervention",
      next: "/admin/nouveau/apparence",
      step: "Étape 2 sur 4",
    },
    apparence: {
      back: "/admin/nouveau/informations",
      next: "/admin/nouveau/qr",
      nextLabel: "Suivant : QR code",
      step: "Étape 3 sur 4",
    },
  },
};
