import { BadRequestException } from '@nestjs/common';

/** Mots de passe trop courants : refusés quelle que soit leur longueur. */
const COMMON = new Set([
  'password', 'password1', 'motdepasse', 'motdepasse1', 'motdepasse123', 'azerty', 'azertyuiop', 'qwerty', 'qwertyuiop',
  '123456', '12345678', '123456789', '1234567890', 'abcdefgh', 'azerty123', 'qwerty123', 'moncode', 'moncode123',
  'admin', 'admin123', 'administrateur', 'bienvenue', 'iloveyou', 'letmein', 'welcome', 'welcome1',
]);

/**
 * Règles communes à l'inscription, à la réinitialisation et au changement de mot de passe :
 * 8 caractères au moins (12 pour un administrateur), au moins une lettre et un chiffre, ni l'adresse e-mail ni un mot de passe courant.
 */
export function assertStrongPassword(password: string, options: { email?: string; admin?: boolean } = {}): void {
  const value = password ?? '';
  const min = options.admin ? 12 : 8;
  if (value.length < min) throw new BadRequestException(`Le mot de passe doit contenir au moins ${min} caractères.`);
  if (value.length > 128) throw new BadRequestException('Le mot de passe est trop long (128 caractères au plus).');
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    throw new BadRequestException('Le mot de passe doit contenir au moins une lettre et un chiffre.');
  }
  const lower = value.toLowerCase();
  const local = (options.email ?? '').toLowerCase().split('@')[0];
  if (COMMON.has(lower) || (local.length >= 4 && lower.includes(local)) || /^(.)\1+$/.test(value)) {
    throw new BadRequestException('Ce mot de passe est trop facile à deviner : évitez les mots courants et votre adresse e-mail.');
  }
}
