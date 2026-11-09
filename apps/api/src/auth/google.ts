import { UnauthorizedException } from '@nestjs/common';

/** Contenu d'un jeton d'identité Google, tel que renvoyé par `tokeninfo`. */
export interface GoogleClaims {
  aud?: string;
  iss?: string;
  exp?: string | number;
  email?: string;
  email_verified?: string | boolean;
  name?: string;
  picture?: string;
}

export interface GoogleProfile {
  email: string;
  name: string | null;
  /** Photo de profil, seulement si c'est une adresse https. */
  picture: string | null;
}

/** Vérifie les revendications d'un jeton Google : destinataire, émetteur, expiration, e-mail vérifié. */
export function checkGoogleClaims(claims: GoogleClaims, clientId: string, now = Date.now()): GoogleProfile {
  if (claims.aud !== clientId) throw new UnauthorizedException('Jeton Google destiné à une autre application.');
  if (claims.iss !== 'accounts.google.com' && claims.iss !== 'https://accounts.google.com') {
    throw new UnauthorizedException('Émetteur du jeton Google invalide.');
  }
  if (!claims.exp || Number(claims.exp) * 1000 < now) throw new UnauthorizedException('Jeton Google expiré : réessayez.');
  if (!(claims.email_verified === true || claims.email_verified === 'true')) {
    throw new UnauthorizedException('Adresse e-mail Google non vérifiée.');
  }
  const email = (claims.email ?? '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new UnauthorizedException('Adresse e-mail Google invalide.');
  const picture = typeof claims.picture === 'string' && /^https:\/\//.test(claims.picture) && claims.picture.length <= 500 ? claims.picture : null;
  return { email, name: claims.name?.trim().slice(0, 120) || null, picture };
}

/** Fait confirmer le jeton par Google (signature comprise) puis contrôle son contenu. */
export async function verifyGoogleCredential(credential: string, clientId: string): Promise<GoogleProfile> {
  if (!credential || credential.length > 4096) throw new UnauthorizedException('Jeton Google manquant.');
  let res: Response;
  try {
    res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`, {
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new UnauthorizedException('Google ne répond pas : réessayez dans un instant.');
  }
  if (!res.ok) throw new UnauthorizedException('Jeton Google refusé.');
  return checkGoogleClaims((await res.json()) as GoogleClaims, clientId);
}
