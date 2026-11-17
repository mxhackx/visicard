import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import 'multer';

/**
 * Filtre d'upload selon le champ :
 *  - `media`    : image, vidéo ou audio (service QR image / vidéo / audio)
 *  - `document` : PDF uniquement (service QR document)
 *  - le reste   : images de la page digitale
 */
export function cardFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const type = file.mimetype || '';

  if (file.fieldname === 'document') {
    if (type !== 'application/pdf') {
      return callback(
        new BadRequestException(`Le document "${file.originalname}" doit être un PDF.`),
        false,
      );
    }
    return callback(null, true);
  }

  if (file.fieldname === 'media') {
    if (!type.startsWith('image/') && !type.startsWith('video/') && !type.startsWith('audio/')) {
      return callback(
        new BadRequestException(`Le fichier "${file.originalname}" doit être une image, une vidéo ou un audio.`),
        false,
      );
    }
    return callback(null, true);
  }

  // Images de page : converties en WebP par sharp, qui ne lit pas le HEIC des iPhone.
  if (!PAGE_IMAGE_TYPES.includes(type)) {
    return callback(
      new BadRequestException(
        type === 'image/heic' || type === 'image/heif'
          ? `« ${file.originalname} » est au format HEIC (iPhone) : exportez-la en JPG ou PNG.`
          : `« ${file.originalname} » n'est pas une image prise en charge (JPG, PNG, WEBP).`,
      ),
      false,
    );
  }
  return callback(null, true);
}

const PAGE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

/** Champs de fichiers acceptés à la création ou à la modification d'un contenu. */
export const CARD_FILE_FIELDS = [
  { name: 'file', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'menu', maxCount: 8 },
  { name: 'place', maxCount: 8 },
  { name: 'media', maxCount: 1 },
  { name: 'document', maxCount: 1 },
];

/** Image, vidéo, audio et PDF : 200 Mo au plus par fichier (Premium). */
export const MAX_MEDIA_BYTES = 200 * 1024 * 1024;
/** Photos d'une page digitale (réduites en WebP à l'enregistrement) : 12 Mo au plus chacune. */
export const MAX_PAGE_IMAGE_BYTES = 12 * 1024 * 1024;

export const CARD_UPLOAD_LIMITS = { fileSize: MAX_MEDIA_BYTES, files: 12 };

/** La limite générale est celle des médias : les photos de page, elles, sont plafonnées plus bas. */
export function assertFileSizes(files: Partial<Record<string, Express.Multer.File[] | Express.Multer.File | undefined>> | undefined): void {
  if (!files) return;
  for (const [field, value] of Object.entries(files)) {
    if (field === 'media' || field === 'document' || !value) continue;
    for (const f of Array.isArray(value) ? value : [value]) {
      if (f.size > MAX_PAGE_IMAGE_BYTES) {
        throw new BadRequestException(`La photo « ${f.originalname} » dépasse 12 Mo : réduisez-la avant de l'envoyer.`);
      }
    }
  }
}
