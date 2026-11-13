import { BadRequestException, Body, Controller, Delete, Get, Headers, HttpCode, Param, Patch, Post, Query, Req, ServiceUnavailableException, UnauthorizedException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { sendContactMessage } from './notify';
import { FileInterceptor } from '@nestjs/platform-express';
import { CardsService } from '../cards/cards.service';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { AccountService } from './account.service';

/** Espace du propriétaire d'un QR code : performances, gestion commerciale, demandes, établissements. */
@Controller('me')
@SkipThrottle({ short: true })
export class AccountController {
  constructor(
    private readonly account: AccountService,
    private readonly auth: AuthService,
    private readonly cardsService: CardsService,
  ) {}

  private async userId(req: Request, authHeader?: string): Promise<string> {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    const result = token ? await this.auth.validateToken(token) : null;
    if (!result?.valid || !result.user) throw new UnauthorizedException('Connectez-vous pour accéder à votre espace.');
    return result.user.id;
  }

  @Get('summary')
  async summary(@Req() req: Request, @Headers('authorization') h?: string) {
    return this.account.summary(await this.userId(req, h));
  }

  /** Envoie une photo de produit (JPEG, PNG, WebP, 3 Mo) et renvoie son adresse. */
  @Post('cards/:slug/images')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 3 * 1024 * 1024, files: 1 } }))
  async uploadImage(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('slug') slug: string, @UploadedFile() file?: Express.Multer.File) {
    await this.account.liveState(await this.userId(req, h), slug); // vérifie que le QR code appartient au compte
    return this.cardsService.storeOwnerImage(file, slug);
  }

  @Get('cards')
  async cards(@Req() req: Request, @Headers('authorization') h?: string) {
    return this.account.listCards(await this.userId(req, h));
  }

  @Get('cards/:slug/analytics')
  async analytics(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('slug') slug: string, @Query('days') days?: string) {
    return this.account.analytics(await this.userId(req, h), slug, Number(days) || 30);
  }

  @Get('cards/:slug/live')
  async live(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('slug') slug: string) {
    return this.account.liveState(await this.userId(req, h), slug);
  }

  @Patch('cards/:slug/live')
  async updateLive(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('slug') slug: string, @Body() body: Record<string, unknown>) {
    return this.account.updateLive(await this.userId(req, h), slug, body as never);
  }

  @Get('requests')
  async requests(@Req() req: Request, @Headers('authorization') h: string | undefined, @Query('slug') slug?: string, @Query('status') status?: string) {
    return this.account.listRequests(await this.userId(req, h), { slug, status });
  }

  @Patch('requests/:id')
  async setRequest(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('id') id: string, @Body() body: { status?: string }) {
    return this.account.setRequestStatus(await this.userId(req, h), id, body?.status ?? '');
  }

  @Get('establishments')
  async establishments(@Req() req: Request, @Headers('authorization') h?: string) {
    return this.account.listEstablishments(await this.userId(req, h));
  }

  @Post('establishments')
  async createEstablishment(@Req() req: Request, @Headers('authorization') h: string | undefined, @Body() body: { name?: string; city?: string }) {
    return this.account.createEstablishment(await this.userId(req, h), body?.name ?? '', body?.city);
  }

  @Patch('establishments/:id')
  async updateEstablishment(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('id') id: string, @Body() body: { name?: string; city?: string }) {
    return this.account.updateEstablishment(await this.userId(req, h), id, body ?? {});
  }

  @Delete('establishments/:id')
  async deleteEstablishment(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('id') id: string) {
    return this.account.deleteEstablishment(await this.userId(req, h), id);
  }
}

/** Demande d'un visiteur (réservation, commande, message) : publique, limitée pour éviter le spam. */
@Controller('cards')
export class PublicRequestsController {
  constructor(private readonly account: AccountService) {}

  @Post(':slug/requests')
  @HttpCode(201)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  submit(@Param('slug') slug: string, @Body() body: Record<string, unknown>) {
    return this.account.submitRequest(slug, body as never);
  }
}

/** Formulaire de contact du site : envoyé par e-mail à l'équipe (public, limité, avec piège anti-robots). */
@Controller('contact')
export class ContactController {
  @Post()
  @HttpCode(200)
  @Throttle({ short: { limit: 3, ttl: 60_000 } })
  async send(@Body() body: Record<string, unknown>) {
    const text = (k: string, max: number) => (typeof body?.[k] === 'string' ? (body[k] as string).trim().slice(0, max) : '');
    // Champ « website » invisible : seuls les robots le remplissent. On répond OK sans rien envoyer.
    if (text('website', 100)) return { sent: true };
    const name = text('name', 120);
    const email = text('email', 160);
    const phone = text('phone', 40);
    const message = text('message', 4000);
    if (name.length < 2) throw new BadRequestException('Indiquez votre nom.');
    if (!/^\S+@\S+\.\S+$/.test(email)) throw new BadRequestException('Adresse e-mail invalide.');
    if (phone.replace(/\D/g, '').length < 8) throw new BadRequestException('Numéro de téléphone trop court pour être joint.');
    if (message.length < 10) throw new BadRequestException('Décrivez votre besoin en quelques mots.');
    const sent = await sendContactMessage({ name, business: text('business', 120), email, phone, kind: text('kind', 60), message });
    if (!sent.ok) throw new ServiceUnavailableException(`${sent.reason ?? 'Envoi impossible.'} Écrivez-nous sur WhatsApp.`);
    return { sent: true };
  }
}
