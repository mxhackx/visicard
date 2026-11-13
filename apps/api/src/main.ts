import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { UploadErrorsFilter } from './common/upload-errors.filter';

// Une promesse rejetée sans traitement (envoi d'e-mail, tâche de fond…) ne doit pas arrêter l'API.
process.on('unhandledRejection', (reason) => {
  console.error('Promesse rejetée non gérée :', reason);
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // Corps brut conservé (utile à la vérification des webhooks).
    rawBody: true,
  });

  // Derrière le proxy de Render, `req.ip` serait l'adresse du proxy pour tout le monde : toutes les
  // personnes partageraient alors le même quota. On lit l'adresse réelle (en-tête X-Forwarded-For).
  app.set('trust proxy', 1);

  // APP_URL, localhost:3000 et, au besoin, des origines supplémentaires séparées par des virgules (CORS_ORIGINS).
  const allowedOrigins = [
    process.env.APP_URL,
    'http://localhost:3000',
    ...(process.env.CORS_ORIGINS ?? '').split(',').map((o) => o.trim()),
  ].filter(Boolean) as string[];

  // En développement, le front tombe sur le premier port libre (Next décale de
  // 3000 à 3001, 3100… sitôt qu'un port est déjà pris) : toute origine locale
  // est donc acceptée, sans que la connexion dépende de la valeur d'APP_URL.
  // En production la liste stricte reste l'unique référence.
  const enDeveloppement = process.env.NODE_ENV !== 'production';

app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    if (
      enDeveloppement &&
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    ) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  credentials: true,  
});
  app.useGlobalFilters(new UploadErrorsFilter());

  app.use(
    cookieParser(),
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Stockage local de repli (Supabase Storage absent) : les QR média/documents
  // et les images de page sont servis depuis /uploads.
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  const port = process.env.PORT ?? 5500;
  await app.listen(port);
  console.log(`MonCode API is running on: http://localhost:${port}`);
}
bootstrap();
