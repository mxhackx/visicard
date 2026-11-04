import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto';

/**
 * Hachage des mots de passe du compte admin stocké en base.
 *
 * `bcrypt` et `argon2` ne sont pas installés et l'installation est impossible
 * hors connexion : on utilise `scrypt`, fourni par `node:crypto`. Les paramètres
 * (N=16384, r=8, p=1) sont ceux recommandés par l'OWASP pour un usage en ligne ;
 * ils tiennent dans la mémoire allouée par défaut par Node.
 *
 * Le format stocké est auto-descriptif, ce qui permet de changer les paramètres
 * plus tard sans invalider les hachages existants :
 *
 *   scrypt$N$r$p$sel$empreinte
 *
 * Les deux derniers segments sont en base64 standard.
 */

// `promisify(scrypt)` retient la surcharge à trois arguments et refuse les
// options de coût ; la promesse est donc écrite à la main.
function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(derivedKey);
    });
  });
}

const ALGO = 'scrypt';
const COST_N = 16_384;
const COST_R = 8;
const COST_P = 1;
const SALT_BYTES = 16;
const HASH_BYTES = 32;
// scrypt demande 128 * N * r octets, soit ~16 Mo ici ; la marge évite un refus
// sur les machines où la limite par défaut de Node est plus basse.
const MAXMEM = 64 * 1024 * 1024;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES);
  const hash = await scryptAsync(password, salt, HASH_BYTES, {
    N: COST_N,
    r: COST_R,
    p: COST_P,
    maxmem: MAXMEM,
  });

  return [
    ALGO,
    COST_N,
    COST_R,
    COST_P,
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$');
}

/**
 * Renvoie `true` seulement si `password` correspond au hachage stocké.
 * Une valeur mal formée est traitée comme une absence de correspondance, jamais
 * comme une exception : l'appelant doit pouvoir rester sur un message
 * « identifiants incorrects » générique.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  if (!password || !storedHash) return false;

  const segments = storedHash.split('$');
  if (segments.length !== 6 || segments[0] !== ALGO) return false;

  const [, n, r, p, saltBase64, hashBase64] = segments;
  const costs = [n, r, p].map(Number);
  if (costs.some((value) => !Number.isInteger(value) || value <= 0)) return false;

  const [costN, costR, costP] = costs;
  const salt = Buffer.from(saltBase64, 'base64');
  const expected = Buffer.from(hashBase64, 'base64');

  let actual: Buffer;
  try {
    actual = await scryptAsync(password, salt, expected.length, {
      N: costN,
      r: costR,
      p: costP,
      maxmem: MAXMEM,
    });
  } catch {
    return false;
  }

  if (actual.length !== expected.length) return false;

  return timingSafeEqual(actual, expected);
}
