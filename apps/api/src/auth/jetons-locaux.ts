import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

/**
 * Jetons de session pour les comptes stockés dans la base (table `admin_users`).
 *
 * Le chemin Supabase existant reste inchangé : il fournit ses propres jetons.
 * Ce chemin local n'intervient que lorsque Supabase n'est pas configuré,
 * c'est-à-dire en développement hors connexion.
 *
 * `jsonwebtoken` et `jose` ne sont pas installés et ne peuvent pas être
 * téléchargés ici : le format JWT HS256 est donc produit à la main, avec
 * `node:crypto` uniquement. Le secret reste dans l'API (pas de vérification à
 * distance, pas de JWKS).
 *
 * Format : `base64url(entete).base64url(charge).base64url(signature)`
 */

export type LocalTokenType = 'access' | 'refresh';

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
const REFRESH_TTL = 7 * 24 * 60 * 60;

const ISSUER = 'moncode-local';
const MIN_SECRET_LENGTH = 16;

function toBase64Url(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function fromBase64Url(segment: string): string {
  return Buffer.from(segment, 'base64url').toString('utf8');
}

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

function sign(body: string): Buffer {
  return createHmac('sha256', readSecret()).update(body).digest();
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
    exp: now + (type === 'access' ? ACCESS_TTL : REFRESH_TTL),
  };

  const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = `${header}.${toBase64Url(JSON.stringify(payload))}`;

  return `${body}.${sign(body).toString('base64url')}`;
}

/**
 * Renvoie la charge si le jeton est authentique, non expiré et émis par ce
 * chemin local ; `null` sinon. Les erreurs de parsing sont volontairement
 * silencieuses : un jeton qui n'est pas local vient d'un autre émetteur
 * (Supabase) et l'appelant doit tenter sa propre vérification ensuite.
 */
export function readLocalToken(
  token: string,
  expectedType: LocalTokenType,
): LocalTokenPayload | null {
  if (!token) return null;

  const segments = token.split('.');
  if (segments.length !== 3) return null;

  const [header, claims, signature] = segments;

  let algorithm: string;
  try {
    algorithm = (JSON.parse(fromBase64Url(header)) as { alg?: string }).alg ?? '';
  } catch {
    return null;
  }
  // Sans ce contrôle, un jeton « alg: none » ou RS256 se prétendant valide
  // passerait la comparaison de signature vide.
  if (algorithm !== 'HS256') return null;

  const expected = sign(`${header}.${claims}`);
  const received = Buffer.from(signature, 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return null;
  }

  let payload: LocalTokenPayload;
  try {
    payload = JSON.parse(fromBase64Url(claims)) as LocalTokenPayload;
  } catch {
    return null;
  }

  if (payload.iss !== ISSUER || payload.typ !== expectedType) return null;
  if (typeof payload.exp !== 'number' || payload.exp <= Math.floor(Date.now() / 1000)) {
    return null;
  }

  return payload;
}
