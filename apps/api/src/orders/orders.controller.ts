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
import type { Request } from 'express';
import 'multer';
import { OrdersService } from './orders.service';
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
    'xUrl', 'snapchatUrl', 'schedule', 'additionalInfo', 'themeId', 'cardLayout', 'qrStyle',
  ] as const;
  const out: CardMetadata = {};
  for (const key of keys) if (typeof body?.[key] === 'string') out[key] = body[key];
  return out;
}

/** Le jeton du lien privé circule dans l'en-tête `X-Order-Key` (jamais dans l'URL d'API). */
function orderKey(header: string | undefined): string {
  if (!header) throw new UnauthorizedException('Lien de commande requis.');
  return header;
}

@Controller('orders')
export class OrdersController {
  constructor(
    private readonly orders: OrdersService,
    private readonly auth: AuthService,
  ) {}

  /* ---------------------------- Client (sans compte) ---------------------------- */

  @Post()
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileFieldsInterceptor(CARD_FILE_FIELDS, { limits: CARD_UPLOAD_LIMITS, fileFilter: cardFileFilter }))
  create(@UploadedFiles() files: FilesBody, @Body() body: Record<string, string | undefined>) {
    return this.orders.createOrder(
      body?.serviceType,
      { customerName: body?.customerName, customerPhone: body?.customerPhone, customerEmail: body?.customerEmail },
      toUploaded(files),
      contentFrom(body),
    );
  }

  @Get(':reference')
  @SkipThrottle({ short: true })
  get(@Param('reference') reference: string, @Headers('x-order-key') key?: string) {
    return this.orders.getForCustomer(reference, orderKey(key));
  }

  @Post(':reference/modifications')
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  @UseInterceptors(FileFieldsInterceptor(CARD_FILE_FIELDS, { limits: CARD_UPLOAD_LIMITS, fileFilter: cardFileFilter }))
  modify(
    @Param('reference') reference: string,
    @Headers('x-order-key') key: string | undefined,
    @UploadedFiles() files: FilesBody,
    @Body() body: Record<string, string | undefined>,
  ) {
    return this.orders.createModification(reference, orderKey(key), toUploaded(files), contentFrom(body));
  }

  /* ---------------------------------- Admin ---------------------------------- */

  @Get()
  @SkipThrottle({ short: true })
  async list(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    await this.requireAdmin(req, authHeader);
    return this.orders.listForAdmin();
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
