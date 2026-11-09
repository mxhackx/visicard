import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UnauthorizedException,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import 'multer';
import { OrdersService, type OrderAccess } from './orders.service';
import { FedapayService } from './payments/fedapay.service';
import { PremiumService } from './premium.service';
import { AuthService } from '../auth/auth.service';
import { CARD_FILE_FIELDS, CARD_UPLOAD_LIMITS, cardFileFilter } from '../cards/card-files';
import type { CardMetadata, UploadedCardFiles } from '../cards/cards.service';

type FilesBody = Partial<Record<'file' | 'logo' | 'menu' | 'place' | 'media' | 'document', Express.Multer.File[]>>;

function toUploaded(files: FilesBody | undefined): UploadedCardFiles {
  return {
    file: files?.file?.[0],
    logo: files?.logo?.[0],
    menu: files?.menu ?? [],
    place: files?.place ?? [],
    media: files?.media?.[0],
    document: files?.document?.[0],
  };
}

/** Champs de contenu acceptés depuis un formulaire client (rien d'interne à l'admin). */
function contentFrom(body: Record<string, string | undefined>): CardMetadata {
  const keys = [
    'title', 'restaurantName', 'address', 'locationUrl', 'phoneNumber', 'facebookUrl', 'instagramUrl',
    'xUrl', 'snapchatUrl', 'schedule', 'additionalInfo', 'themeId', 'cardLayout', 'qrStyle', 'directPayload',
  ] as const;
  const out: CardMetadata = {};
  for (const key of keys) if (typeof body?.[key] === 'string') out[key] = body[key];
  return out;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly auth: AuthService,
    private readonly fedapay: FedapayService,
  ) {}

  /** Bearer ou cookie de session ; `null` si absent ou invalide. */
  private async sessionUser(req: Request, authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    if (!token) return null;
    const { valid, user } = await this.auth.validateToken(token);
    return valid && user ? user : null;
  }

  /** Accès à une commande : lien privé (`X-Order-Key`) ou compte propriétaire. */
  private async access(req: Request, key?: string, authHeader?: string): Promise<OrderAccess> {
    const user = await this.sessionUser(req, authHeader);
    if (!key && !user) throw new UnauthorizedException('Lien de commande ou connexion requis.');
    return { token: key, userId: user?.id };
  }

  /* ------------------------------------ Client ------------------------------------ */

  /** Les commandes du compte connecté (avant `:reference`, qui capterait « mine »). */
  @Get('mine')
  @SkipThrottle({ short: true })
  async mine(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const user = await this.sessionUser(req, authHeader);
    if (!user) throw new UnauthorizedException('Connexion requise.');
    return this.orders.listForUser(user.id);
  }

  @Post()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileFieldsInterceptor(CARD_FILE_FIELDS, { limits: CARD_UPLOAD_LIMITS, fileFilter: cardFileFilter }))
  async create(
    @Req() req: Request,
    @UploadedFiles() files: FilesBody,
    @Body() body: Record<string, string | undefined>,
    @Headers('authorization') authHeader?: string,
  ) {
    const user = await this.sessionUser(req, authHeader);
    return this.orders.createOrder(
      body?.serviceType,
      { customerName: body?.customerName, customerPhone: body?.customerPhone, customerEmail: body?.customerEmail },
      toUploaded(files),
      contentFrom(body),
      user?.id ?? null,
      user?.role,
    );
  }

  @Get(':reference')
  @SkipThrottle({ short: true })
  async get(
    @Req() req: Request,
    @Param('reference') reference: string,
    @Headers('x-order-key') key?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.orders.getForCustomer(reference, await this.access(req, key, authHeader));
  }

  @Post(':reference/payments')
  @HttpCode(200)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async pay(
    @Req() req: Request,
    @Param('reference') reference: string,
    @Headers('x-order-key') key?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.orders.startPayment(reference, await this.access(req, key, authHeader));
  }

  @Post(':reference/payments/refresh')
  @HttpCode(200)
  @SkipThrottle({ short: true })
  async refresh(
    @Req() req: Request,
    @Param('reference') reference: string,
    @Headers('x-order-key') key?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.orders.refreshPayment(reference, await this.access(req, key, authHeader));
  }

  @Post(':reference/modifications')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileFieldsInterceptor(CARD_FILE_FIELDS, { limits: CARD_UPLOAD_LIMITS, fileFilter: cardFileFilter }))
  async modify(
    @Req() req: Request,
    @Param('reference') reference: string,
    @UploadedFiles() files: FilesBody,
    @Body() body: Record<string, string | undefined>,
    @Headers('x-order-key') key?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    return this.orders.createModification(reference, await this.access(req, key, authHeader), toUploaded(files), contentFrom(body));
  }

  /* ---------------------------------- Admin ---------------------------------- */

  @Get()
  @SkipThrottle({ short: true })
  async list(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    return this.orders.listForAdmin();
  }

  /** État du système pour l'onglet Paramètres (aucune valeur secrète n'est renvoyée). */
  @Get('admin/system/status')
  async systemStatus(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    const base = process.env.PUBLIC_API_URL || process.env.API_URL || '';
    return {
      payment: {
        provider: 'FedaPay',
        configured: this.fedapay.configured,
        mode: process.env.FEDAPAY_ENV === 'live' ? 'live' : 'sandbox',
        webhookSecret: Boolean(process.env.FEDAPAY_WEBHOOK_SECRET),
        webhookPath: '/payments/fedapay/webhook',
        webhookUrl: base ? `${base.replace(/\/$/, '')}/payments/fedapay/webhook` : null,
      },
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'développement',
      node: process.version,
      uptimeSeconds: Math.round(process.uptime()),
    };
  }

  @Get('admin/:reference')
  @SkipThrottle({ short: true })
  async adminView(@Req() req: Request, @Param('reference') reference: string, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    return this.orders.getForAdmin(reference);
  }

  /** Les paiements se règlent sur WhatsApp : l'admin confirme ici l'encaissement. */
  @Post('admin/:id/mark-paid')
  @HttpCode(200)
  async markPaid(@Req() req: Request, @Param('id') id: string, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    return this.orders.markPaidManually(id);
  }

  @Post('admin/:id/cancel')
  @HttpCode(200)
  async cancel(@Req() req: Request, @Param('id') id: string, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    return this.orders.cancel(id);
  }

  private async requireAdmin(req: Request, authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    if (!token || !(await this.auth.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
  }
}

/** Notifications serveur à serveur de FedaPay. */
@Controller('payments')
@SkipThrottle()
export class PaymentsWebhookController {
  constructor(
    private readonly orders: OrdersService,
    private readonly fedapay: FedapayService,
    private readonly premium: PremiumService,
  ) {}

  @Post('fedapay/webhook')
  @HttpCode(200)
  async fedapayWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-fedapay-signature') signature: string | undefined,
    @Body() body: { name?: string; entity?: { id?: number | string } },
  ) {
    if (!this.fedapay.verifyWebhookSignature(req.rawBody, signature)) {
      throw new UnauthorizedException('Signature FedaPay invalide.');
    }
    // Le statut est relu chez FedaPay : le contenu du webhook ne suffit pas à valider un paiement.
    if (!(await this.premium.handleEvent(body?.entity?.id))) await this.orders.handleFedapayEvent(body?.entity?.id);
    return { received: true };
  }
}
