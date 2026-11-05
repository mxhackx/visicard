import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { join } from 'node:path';
import { UploadErrorsFilter } from './common/upload-errors.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const allowedOrigins = [
  process.env.APP_URL,
  'http://localhost:3000', 
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
