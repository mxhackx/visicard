import { resolveGeo } from './geo';
import {
  HttpCode,
  Req,
  Controller,
  Get, Delete,
  Post,
  Patch,
  Param,
  Body,
  Res,
  Headers,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import 'multer';
import { CardsService } from './cards.service';
import { AuthService } from '../auth/auth.service';
import { sendQrToOwner } from '../account/notify';
import { CARD_FILE_FIELDS, CARD_UPLOAD_LIMITS, cardFileFilter } from './card-files';

export class UpdateCardDto {
  serviceType?: string;
  title?: string;
  userName?: string;
  clientName?: string;
  workDone?: string;
  amountReceived?: number;
  currency?: string;
  restaurantName?: string;
  address?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  schedule?: string;
  additionalInfo?: string;
  themeId?: string;
  cardLayout?: string;
  qrStyle?: string;
}
export class CreateCardDto {
  serviceType?: string;
  title?: string;
  userName?: string;
  clientName?: string;
  workDone?: string;
  amountReceived?: number;
  currency?: string;
  restaurantName?: string;
  address?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  schedule?: string;
  additionalInfo?: string;
  themeId?: string;
  cardLayout?: string;
  qrStyle?: string;
}
/** Cookie de la requête (cookie-parser), sans `any`. */
function cookieOf(req: Request, name: string): string | null {
  return (req as Request & { cookies?: Record<string, string> }).cookies?.[name] ?? null;
}

@Controller('cards')
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly authService: AuthService,
  ) {}
  // Constante pour réutiliser la configuration d'upload
  private readonly uploadOptions = {
    limits: {
      fileSize: 6 * 1024 * 1024,
      files: 10,
    },
    fileFilter: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, acceptFile: boolean) => void) => {
      if (!file.mimetype || !file.mimetype.startsWith('image/')) {
        return callback(
          new BadRequestException(`Le fichier "${file.originalname}" n'est pas une image valide (format attendu: PNG, JPG, WEBP)`),
          false,
        );
      }
      callback(null, true);
    },
  };
  /** Envoie à son propriétaire (par e-mail, en PNG) le QR code d'une carte de son espace. */
  @Post(':slug/send-me')
  @HttpCode(200)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async sendToMe(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('slug') slug: string,
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = cookieOf(req, 'access_token');
    const session = token ? await this.authService.validateToken(token) : null;
    if (!session?.valid || !session.user?.email) throw new UnauthorizedException('Connexion requise.');
    const card = await this.cardsService.findOwnedBy(slug, session.user.id, session.user.role === 'admin');
    const { qrCode, cardUrl } = await this.cardsService.getQrCode(slug);
    const sent = await sendQrToOwner(session.user.email, {
      title: card.title || card.restaurantName || 'QR code',
      target: cardUrl,
      pngDataUrl: qrCode,
    });
    if (!sent) throw new ServiceUnavailableException('L’envoi par e-mail n’est pas encore activé : téléchargez le QR code depuis votre espace.');
    return { sent: true, to: session.user.email };
  }

  /**
   * QR code créé dans le créateur du site : enregistré en base, quel que soit son contenu.
   * Sans compte, seuls les liens sont acceptés (gratuits) ; le reste exige un compte Premium.
   */
  @Post('direct')
  @HttpCode(200)
  @Throttle({ short: { limit: 15, ttl: 60_000 } })
  async saveDirect(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { payload?: string; qrStyle?: string; title?: string },
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = cookieOf(req, 'access_token');
    let user: { id: string; role?: string } | null = null;
    if (token) {
      const { valid, user: u } = await this.authService.validateToken(token);
      if (valid && u) user = { id: u.id, role: u.role };
    }
    return this.cardsService.createDirect(user, body ?? {});
  }

  /**
   * Création de carte d'intervention (Protégée)
   */
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
      { name: 'menu', maxCount: 8 },
      { name: 'place', maxCount: 8 },
      { name: 'media', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ], {
      limits: { fileSize: 32 * 1024 * 1024, files: 12 },
      fileFilter: cardFileFilter,
    })
  )
  async uploadCardProtected(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @UploadedFiles() files: {
      file?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      menu?: Express.Multer.File[];
      place?: Express.Multer.File[];
      media?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
    @Body() body?: CreateCardDto,
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token');
    }
    if (!token) {
      throw new UnauthorizedException("Authentification requise pour générer un QR code.");
    }
    const { valid, user } = await this.authService.validateToken(token);
    if (!valid || !user) {
      throw new UnauthorizedException("Session utilisateur expirée ou invalide.");
    }
    // Création directe et gratuite : réservée à l'admin. Les clients passent par /orders.
    if (user.role !== 'admin') {
      throw new ForbiddenException("Les QR codes clients se créent via une commande (devis puis paiement).");
    }

    const singleFile = files?.file?.[0];
    const logoFile = files?.logo?.[0];
    const menuFiles = files?.menu ?? [];
    const placeFiles = files?.place ?? [];
    const mediaFile = files?.media?.[0];
    const documentFile = files?.document?.[0];
    const serviceType = body?.serviceType ?? 'page';

    if (serviceType === 'page' && !singleFile && !logoFile && menuFiles.length === 0) {
      throw new BadRequestException('Veuillez fournir au moins une image (carte, logo ou menu).');
    }
    if (serviceType === 'media' && !mediaFile) {
      throw new BadRequestException('Veuillez fournir une image ou une vidéo.');
    }
    if (serviceType === 'document' && !documentFile) {
      throw new BadRequestException('Veuillez fournir un document PDF.');
    }

    return this.cardsService.createCard(
      {
        file: singleFile,
        logo: logoFile,
        menu: menuFiles,
        place: placeFiles,
        media: mediaFile,
        document: documentFile,
      },
      body,
      user.id,
    );
  }
  /**
   * Création de carte de visite publique (Non protégée)
   */
  @Post('visite')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'file', maxCount: 1 },
      { name: 'logo', maxCount: 1 },
      { name: 'menu', maxCount: 8 },
      { name: 'place', maxCount: 8 },
      { name: 'media', maxCount: 1 },
      { name: 'document', maxCount: 1 },
    ], {
      limits: { fileSize: 32 * 1024 * 1024, files: 12 },
      fileFilter: cardFileFilter,
    })
  )
  async uploadCardPublic(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @UploadedFiles() files: {
      file?: Express.Multer.File[];
      logo?: Express.Multer.File[];
      menu?: Express.Multer.File[];
      place?: Express.Multer.File[];
      media?: Express.Multer.File[];
      document?: Express.Multer.File[];
    },
    @Body() body?: CreateCardDto,
  ) {
    // Ancienne route publique : elle créait des QR actifs sans paiement. Réservée à l'admin.
    let adminToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!adminToken) adminToken = cookieOf(req, 'access_token');
    if (!adminToken || !(await this.authService.validateAdminToken(adminToken))) {
      throw new ForbiddenException("Les QR codes clients se créent via une commande (devis puis paiement).");
    }
    const singleFile = files?.file?.[0];
    const logoFile = files?.logo?.[0];
    const menuFiles = files?.menu ?? [];
    const placeFiles = files?.place ?? [];
    const mediaFile = files?.media?.[0];
    const documentFile = files?.document?.[0];
    const serviceType = body?.serviceType ?? 'page';

    if (serviceType === 'page' && !singleFile && !logoFile && menuFiles.length === 0) {
      throw new BadRequestException('Veuillez fournir au moins une image (carte, logo ou menu).');
    }
    if (serviceType === 'media' && !mediaFile) {
      throw new BadRequestException('Veuillez fournir une image ou une vidéo.');
    }
    if (serviceType === 'document' && !documentFile) {
      throw new BadRequestException('Veuillez fournir un document PDF.');
    }

    // Associe le QR code au compte connecté s'il existe, sans obliger à se connecter.
    let ownerId: string | null = null;
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token') ?? cookieOf(req, 'refresh_token') ?? null;
    }
    if (token) {
      const { valid, user } = await this.authService.validateToken(token);
      if (valid && user?.id) {
        ownerId = user.id;
      }
    }

    const sanitizedBody = { ...(body ?? {}) };
    if (serviceType !== 'page') {
      delete sanitizedBody.userName;
      delete sanitizedBody.clientName;
      delete sanitizedBody.workDone;
      delete sanitizedBody.amountReceived;
      delete sanitizedBody.currency;
      delete sanitizedBody.restaurantName;
      delete sanitizedBody.address;
      delete sanitizedBody.phoneNumber;
      delete sanitizedBody.facebookUrl;
      delete sanitizedBody.instagramUrl;
      delete sanitizedBody.xUrl;
      delete sanitizedBody.snapchatUrl;
      delete sanitizedBody.schedule;
      delete sanitizedBody.additionalInfo;
    } else {
      delete sanitizedBody.userName;
      delete sanitizedBody.clientName;
      delete sanitizedBody.workDone;
      delete sanitizedBody.amountReceived;
      delete sanitizedBody.currency;
    }

    return this.cardsService.createCard(
      { file: singleFile, logo: logoFile, menu: menuFiles, place: placeFiles, media: mediaFile, document: documentFile },
      sanitizedBody,
      ownerId,
    );
  }
  @Get()
  async getAllCards(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token');
    }
    if (!token) {
      throw new UnauthorizedException('Accès réservé aux administrateurs. Token d’authentification manquant.');
    }
    const isValid = await this.authService.validateAdminToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Session administrateur expirée ou invalide');
    }
    return this.cardsService.getAllCards();
  }

  /** QR codes du client connecté, pour son espace personnel. */
  @Get('mine')
  async getMyCards(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token') ?? cookieOf(req, 'refresh_token') ?? null;
    }
    if (!token) {
      throw new UnauthorizedException('Connectez-vous pour retrouver vos QR codes.');
    }
    const { valid, user } = await this.authService.validateToken(token);
    if (!valid || !user) {
      throw new UnauthorizedException('Session expirée ou invalide.');
    }
    return this.cardsService.getCardsByOwner(user.id);
  }

  @Patch(':slug')
  @UseInterceptors(
    FileFieldsInterceptor(CARD_FILE_FIELDS, { limits: CARD_UPLOAD_LIMITS, fileFilter: cardFileFilter }),
  )
  async updateCard(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('slug') slug: string,
    @UploadedFiles() files: { file?: Express.Multer.File[]; logo?: Express.Multer.File[]; menu?: Express.Multer.File[]; place?: Express.Multer.File[]; media?: Express.Multer.File[]; document?: Express.Multer.File[]; },
    @Body() body: UpdateCardDto,
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token');
    }
    if (!token) {
      throw new UnauthorizedException('Accès réservé aux administrateurs. Token d’authentification manquant.');
    }
    const isValid = await this.authService.validateAdminToken(token);
    if (!isValid) {
      throw new UnauthorizedException('Session administrateur expirée ou invalide');
    }
    return this.cardsService.updateCardBySlug(slug, body, files);
  }
  /** Fiche complète d'une carte pour l'administration (contenu même non payé, commandes). */
  @Get(':slug/admin')
  async getAdminDetail(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.requireAdmin(req, authHeader);
    return this.cardsService.getAdminDetail(slug);
  }

  @Post(':slug/reject')
  async rejectCard(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Body() body: { reason?: string },
    @Headers('authorization') authHeader?: string,
  ) {
    await this.requireAdmin(req, authHeader);
    return this.cardsService.rejectCard(slug, body?.reason ?? '');
  }

  @Post(':slug/restore')
  async restoreCard(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.requireAdmin(req, authHeader);
    return this.cardsService.restoreCard(slug);
  }

  private async requireAdmin(req: Request, authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    if (!token || !(await this.authService.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
  }

  @Get(':slug/download')
  async downloadCard(@Param('slug') slug: string, @Res() res: Response) {
    const fileData = await this.cardsService.getCardFile(slug);
    res.setHeader('Content-Type', fileData.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileData.filename}"`);
    res.send(fileData.buffer);
  }
  /** Compte une ouverture de la page publique (appelée par /c/[slug], une fois par session). */
  @Post(':slug/scan')
  @HttpCode(204)
  @Throttle({ short: { limit: 30, ttl: 60_000 } })
  async recordScan(
    @Param('slug') slug: string,
    @Req() req: Request,
    @Body() body?: { tz?: string; lang?: string },
    @Headers('user-agent') userAgent?: string,
  ) {
    await this.cardsService.recordScan(slug, userAgent, resolveGeo(req.headers, body?.tz, body?.lang));
  }

  @Get(':slug')
  async getCard(@Param('slug') slug: string) {
    return this.cardsService.getCardBySlug(slug);
  }

  @Delete(':slug')
  async deleteCard(
    @Req() req: Request,
    @Param('slug') slug: string,
    @Headers('authorization') authHeader: string | undefined,
  ) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      token = cookieOf(req, 'access_token') ?? cookieOf(req, 'refresh_token') ?? null;
    }
    if (!token) {
      throw new UnauthorizedException("Token d'authentification manquant");
    }
    const { valid, user } = await this.authService.validateToken(token);
    if (!valid || !user) {
      throw new UnauthorizedException('Session expirée ou invalide');
    }
    return this.cardsService.deleteCardBySlug(slug, { id: user.id, role: user.role });
  }

}
