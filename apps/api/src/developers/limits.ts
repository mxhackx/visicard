/** Offres de l'API développeur. Un compte administrateur n'a aucun quota. */
export const API_LIMITS = {
  user: { perMinute: 30, perMonth: 1000, maxKeys: 5 },
  admin: { perMinute: Infinity, perMonth: Infinity, maxKeys: 50 },
} as const;

export const KEY_PREFIX = 'mck_live_';
