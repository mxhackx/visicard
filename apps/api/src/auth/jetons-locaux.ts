import { randomBytes } from 'node:crypto';
import * as jwt from 'jsonwebtoken';

/**
 * Jetons de session pour les comptes stockés dans la base (table `admin_users`).
 *
 * Le chemin Supabase existant reste inchangé : il fournit ses propres jetons.
 * Ce chemin local n'intervient que lorsque Supabase n'est pas configuré,
 * c'est-à-dire en développement hors connexion.
 *
 * Signature et vérification passent par `jsonwebtoken` (bibliothèque éprouvée) : algorithme HS256 imposé,
 * émetteur et expiration contrôlés. Le format des jetons est inchangé : les sessions ouvertes restent valides.
 */

export type LocalTokenType = 'access' | 'refresh' | 'challenge';

export interface LocalTokenPayload {
  sub: string;
  email: string;
  role: 'admin' | 'user';
  iss: string;
  typ: LocalTokenType;
  iat: number;
  exp: number;
}

// Durées alignées sur les maxAge des cookies posés par `AuthController`.
const ACCESS_TTL = 60 * 60;
const REFRESH_TTL = 30 * 24 * 60 * 60;
/** Jeton d'étape intermédiaire (code reçu par e-mail) : valable le temps de saisir le code. */
const CHALLENGE_TTL = 10 * 60;

const ISSUER = 'moncode-local';
const MIN_SECRET_LENGTH = 16;

let processSecret: string | null = null;

/**
 * `AUTH_SECRET` doit être défini ailleurs qu'en développement : sans lui, les
 * jetons sont signés avec une clé apparue au démarrage du processus, donc
 * invalides au redémarrage suivant. On avertit au lieu de bloquer, pour que la
 * connexion admin reste utilisable en local.
 */
function readSecret(): string {
  const fromEnv = process.env.AUTH_SECRET;
  if (fromEnv && fromEnv.trim().length >= MIN_SECRET_LENGTH) {
    return fromEnv;
  }

  if (!processSecret) {
    processSecret = randomBytes(32).toString('hex');
    console.warn(
      "[auth] AUTH_SECRET absent ou trop court : une clé éphémère signe les jetons " +
        "locaux. Les sessions seront perdues au prochain redémarrage de l'API.",
    );
  }

  return processSecret;
}

export function createLocalToken(
  user: { id: string; email: string; role: 'admin' | 'user' },
  type: LocalTokenType,
): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: LocalTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iss: ISSUER,
    typ: type,
    iat: now,
    exp: now + (type === 'access' ? ACCESS_TTL : type === 'challenge' ? CHALLENGE_TTL : REFRESH_TTL),
  };
  return jwt.sign(payload, readSecret(), { algorithm: 'HS256' });
}

/**
 * Renvoie la charge si le jeton est authentique, non expiré et émis par ce
 * chemin local ; `null` sinon. Un jeton qui n'est pas local vient d'un autre
 * émetteur (Supabase) : l'appelant tente alors sa propre vérification.
 */
export function readLocalToken(
  token: string,
  expectedType: LocalTokenType,
): LocalTokenPayload | null {
  if (!token) return null;
  try {
    const payload = jwt.verify(token, readSecret(), { algorithms: ['HS256'], issuer: ISSUER }) as LocalTokenPayload;
    return payload.typ === expectedType ? payload : null;
  } catch {
    return null;
  }
}
