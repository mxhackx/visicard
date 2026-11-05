import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Les erreurs d'upload (multer) arrivent en anglais ; on les traduit pour
 * qu'elles s'affichent telles quelles dans les formulaires. Toute autre
 * erreur HTTP est renvoyée sans changement.
 */
const TRANSLATIONS: Record<string, string> = {
  'File too large': 'Un fichier dépasse 32 Mo.',
  'Too many files': 'Trop de fichiers : 8 photos du menu, 8 photos du lieu et 12 fichiers au total au maximum.',
  'Too many parts': 'Envoi trop volumineux.',
  'Too many fields': 'Envoi trop volumineux.',
  'Field value too long': 'Un champ est trop long.',
  // multer signale ainsi un dépassement du nombre de fichiers d'un champ (maxCount).
  'Unexpected field': 'Trop de photos : 8 photos du menu et 8 photos du lieu au maximum.',
  'ThrottlerException: Too Many Requests': 'Trop de tentatives : patientez une minute avant de réessayer.',
};

@Catch(HttpException)
export class UploadErrorsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse();
    const raw = typeof body === 'string' ? body : (body as { message?: unknown }).message;
    const message = typeof raw === 'string' ? raw : Array.isArray(raw) ? String(raw[0]) : exception.message;
    const translated = TRANSLATIONS[message] ?? (message.startsWith('Unexpected field') ? TRANSLATIONS['Unexpected field'] : undefined);

    if (!translated) {
      res.status(status).json(typeof body === 'string' ? { statusCode: status, message: body } : body);
      return;
    }
    res.status(status).json({ statusCode: status, message: translated });
  }
}
