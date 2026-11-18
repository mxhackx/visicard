import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import 'multer';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';

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


/**
 * Stockage des envois : les gros fichiers (`media`, `document`, jusqu'à 200 Mo) sont écrits sur disque au fil de l'eau,
 * sans jamais tenir en mémoire ; les photos de page (12 Mo au plus) restent en mémoire car elles sont retravaillées (WebP).
 * Un fichier sur disque porte `path` (et pas `buffer`) ; le service le lit et le supprime après stockage.
 */
const TEMP_DIR = path.join(os.tmpdir(), 'moncode-uploads');
const TEMP_MAX_AGE_MS = 60 * 60 * 1000;
let lastSweep = 0;

/** Supprime les fichiers temporaires abandonnés (envoi interrompu, validation refusée) ; au plus une fois par minute. */
function sweepTemp() {
  const now = Date.now();
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  fs.readdir(TEMP_DIR, (err, names) => {
    if (err) return;
    for (const name of names) {
      const file = path.join(TEMP_DIR, name);
      fs.stat(file, (e, st) => {
        if (!e && now - st.mtimeMs > TEMP_MAX_AGE_MS) fs.unlink(file, () => {});
      });
    }
  });
}

export const cardStorage = {
  _handleFile(
    _req: Request,
    file: Express.Multer.File,
    callback: (error?: unknown, info?: Partial<Express.Multer.File>) => void,
  ) {
    if (file.fieldname === 'media' || file.fieldname === 'document') {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
      sweepTemp();
      const filename = randomUUID();
      const target = path.join(TEMP_DIR, filename);
      const out = fs.createWriteStream(target);
      file.stream.on('error', (e) => out.destroy(e));
      out.on('error', (e) => fs.unlink(target, () => callback(e)));
      out.on('finish', () => callback(null, { destination: TEMP_DIR, filename, path: target, size: out.bytesWritten }));
      file.stream.pipe(out);
      return;
    }
    const chunks: Buffer[] = [];
    file.stream.on('data', (c: Buffer) => chunks.push(c));
    file.stream.on('error', (e) => callback(e));
    file.stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      callback(null, { buffer, size: buffer.length });
    });
  },
  _removeFile(_req: Request, file: Express.Multer.File, callback: (error: Error | null) => void) {
    if (file.path) fs.unlink(file.path, () => callback(null));
    else callback(null);
  },
};
