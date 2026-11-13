/** Offres de l'API développeur. Un compte administrateur n'a aucun quota. */
export const API_LIMITS = {
  /** Gratuit : liens simples (type=url) seulement, avec un quota. */
  user: { perMinute: 30, perMonth: 1000, maxKeys: 5 },
  /** Premium : tous les contenus, quota élevé. */
  premium: { perMinute: 120, perMonth: 50000, maxKeys: 10 },
  admin: { perMinute: Infinity, perMonth: Infinity, maxKeys: 50 },
} as const;

export const KEY_PREFIX = 'mck_live_';
