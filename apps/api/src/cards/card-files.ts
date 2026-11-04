import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import 'multer';

/**
 * Filtre d'upload selon le champ :
 *  - `media`    : image ou vidéo (service QR image / vidéo)
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
    if (!type.startsWith('image/') && !type.startsWith('video/')) {
      return callback(
        new BadRequestException(`Le fichier "${file.originalname}" doit être une image ou une vidéo.`),
        false,
      );
    }
    return callback(null, true);
  }

  if (!type.startsWith('image/')) {
    return callback(
      new BadRequestException(
        `Le fichier "${file.originalname}" n'est pas une image valide (PNG, JPG, WEBP).`,
      ),
      false,
    );
  }
  return callback(null, true);
}

/** Champs de fichiers acceptés à la création ou à la modification d'un contenu. */
export const CARD_FILE_FIELDS = [
  { name: 'file', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'menu', maxCount: 8 },
  { name: 'place', maxCount: 8 },
  { name: 'media', maxCount: 1 },
  { name: 'document', maxCount: 1 },
];

export const CARD_UPLOAD_LIMITS = { fileSize: 32 * 1024 * 1024, files: 12 };
