import { BadRequestException } from '@nestjs/common';
import type { CardMetadata, UploadedCardFiles } from '../cards/cards.service';
import type { ServiceType } from './pricing';

/**
 * Contrôles serveur d'une commande client : les mêmes règles que le formulaire
 * (apps/web/lib/validation.ts), pour qu'un appel direct à l'API ne crée jamais
 * un contenu incomplet ou invalide.
 */
const HTTP = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

const SOCIALS = [
  ['facebookUrl', 'Facebook'],
  ['instagramUrl', 'Instagram'],
  ['xUrl', 'X'],
  ['snapchatUrl', 'Snapchat'],
] as const;

function fail(message: string): never {
  throw new BadRequestException(message);
}

function maxLength(value: string | undefined, max: number, label: string) {
  if (value && value.trim().length > max) fail(`${label} : ${max} caractères au maximum.`);
}

export function assertOrderContent(serviceType: ServiceType, metadata: CardMetadata, files: UploadedCardFiles) {
  if (serviceType === 'page') {
    const name = metadata.restaurantName?.trim() ?? '';
    if (name.length < 2) fail('Indiquez le nom de l’établissement.');
    maxLength(name, 90, 'Nom de l’établissement');

    const digits = (metadata.phoneNumber ?? '').replace(/\D/g, '');
    if (digits.length < 8 || digits.length > 15) fail('Numéro WhatsApp de l’établissement invalide.');

    const location = metadata.locationUrl?.trim() ?? '';
    if (!HTTP.test(location)) fail('Localisation invalide : utilisez « Ma position » ou un lien Google Maps.');

    for (const [key, label] of SOCIALS) {
      const value = metadata[key]?.trim();
      if (value && !HTTP.test(value)) fail(`Le lien ${label} doit commencer par https://`);
    }
    maxLength(metadata.address, 200, 'Adresse');
    maxLength(metadata.additionalInfo, 2000, 'Informations supplémentaires');

    if (!files.logo && !files.file && !files.menu?.length) {
      fail('Ajoutez au moins le logo ou une photo du menu.');
    }
  } else {
    maxLength(metadata.title, 90, 'Nom du QR code');
  }
}
