/**
 * Parcours de création d'une page digitale.
 *  - client : sans compte. Informations → Apparence → Validation (devis, puis paiement).
 *  - admin  : Informations → Apparence → QR code (actif tout de suite, sans paiement).
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
      backLabel: "Choix du contenu",
      next: "/creer?type=page&etape=apparence",
      step: "Étape 1 sur 3",
    },
    apparence: {
      back: "/creer?type=page&etape=informations",
      next: "/creer?type=page&etape=paiement",
      nextLabel: "Suivant : paiement",
      step: "Étape 2 sur 3",
    },
  },
  admin: {
    requiresAdmin: true,
    loginHref: "/admin/connexion",
    informations: {
      back: "/admin/nouveau",
      backLabel: "Choix du parcours",
      next: "/admin/nouveau/apparence",
      step: "Étape 1 sur 3",
    },
    apparence: {
      back: "/admin/nouveau/informations",
      next: "/admin/nouveau/qr",
      nextLabel: "Suivant : QR code",
      step: "Étape 2 sur 3",
    },
  },
};
