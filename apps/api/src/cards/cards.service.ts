import { publicCatalog } from './catalog';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import * as QRCode from 'qrcode';
import { normalizeQrStyle, parseQrStyle, printableColors } from './qr-style';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Card, Prisma } from '@prisma/client';
import 'multer';
export type CardServiceType = 'page' | 'media' | 'document' | 'direct';

export interface CardMetadata {
  userName?: string;
  clientName?: string;
  workDone?: string;
  amountReceived?: number;
  currency?: string;
  restaurantName?: string;
  address?: string;
  cardLayout?: string;
  locationUrl?: string;
  phoneNumber?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  xUrl?: string;
  snapchatUrl?: string;
  schedule?: string;
  additionalInfo?: string;
  themeId?: string;
  qrStyle?: string;
  /** Nature du QR code : page digitale, média (image / vidéo) ou document. */
  serviceType?: string;
  title?: string;
  /** QR « direct » (payant) : contenu écrit tel quel dans le QR code (tel:, WIFI:, vCard…). */
  directPayload?: string;
}
export interface UploadedCardFiles {
  file?: Express.Multer.File;
  logo?: Express.Multer.File;
  menu?: Express.Multer.File[];
  place?: Express.Multer.File[];
  media?: Express.Multer.File;
  document?: Express.Multer.File;
}
@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);
  private supabase: SupabaseClient | null = null;
  private readonly bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'cards';
  constructor(private readonly prisma: PrismaService) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log(`Supabase Storage configuré (bucket: "${this.bucketName}")`);
    } else {
      this.logger.warn(
        'Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquant). Stockage local en WebP actif en repli.',
      );
    }
  }
  /**
   * Traite une image avec Sharp (optimisation WebP) et la stocke sur Supabase Storage ou en local
   */
  private async processAndUploadImage(buffer: Buffer, fileName: string): Promise<string> {
    let webpBuffer: Buffer;
    try {
      webpBuffer = await sharp(buffer)
        .rotate()
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Format inconnu';
      this.logger.error(`Erreur Sharp sur "${fileName}": ${msg}`);
      throw new BadRequestException(
        `L'image "${fileName}" est corrompue ou dans un format illisible. Veuillez fournir une image valide (PNG, JPEG, WEBP).`,
      );
    }
    if (this.supabase) {
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, webpBuffer, {
          contentType: 'image/webp',
          upsert: true,
        });
      if (uploadError) {
        this.logger.error(`Erreur upload Supabase: ${uploadError.message}`);
        throw new BadRequestException('Échec du stockage de l’image. Veuillez réessayer ultérieurement.');
      }
      const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(fileName);
      return data.publicUrl;
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      await fs.promises.mkdir(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, fileName);
      await fs.promises.writeFile(filePath, webpBuffer);
      const apiUrl = process.env.API_URL ?? 'http://localhost:5500';
      return `${apiUrl}/uploads/${fileName}`;
    }
  }
  /**
   * QR code PNG (data URL) aux couleurs du style enregistré. Les formes (points
   * arrondis, logo) sont dessinées par le navigateur ; ce PNG sert de repli.
   */
  private async generateStyledQrCode(cardUrl: string, qrStyle?: string | null): Promise<string> {
    const { dark, light } = printableColors(parseQrStyle(qrStyle));
    return QRCode.toDataURL(cardUrl, { width: 600, margin: 2, errorCorrectionLevel: 'M', color: { dark, light } });
  }
  /**
   * Stocke un fichier brut (image / vidéo / PDF) en local ou sur Supabase.
   * Le nom est nettoyé et suffixé par un timestamp pour éviter les collisions.
   */
  /** Image de produit envoyée par le propriétaire : JPEG, PNG ou WebP, 3 Mo maximum. */
  async storeOwnerImage(file: Express.Multer.File | undefined, slug: string): Promise<{ url: string }> {
    if (!file) throw new BadRequestException('Aucune image reçue.');
    if (!/^image\/(jpeg|png|webp)$/.test(file.mimetype)) throw new BadRequestException('Format accepté : JPEG, PNG ou WebP.');
    if (file.size > 3 * 1024 * 1024) throw new BadRequestException('Image trop lourde (3 Mo maximum).');
    const stored = await this.storeRawFile(file, `${slug}-produit`);
    return { url: stored.url };
  }

  private async storeRawFile(
    file: Express.Multer.File,
    prefix: string,
  ): Promise<{ url: string; type: string; name: string }> {
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const fileName = `${prefix}-${Date.now()}-${safeOriginalName}`;

    if (this.supabase) {
      const { error: uploadError } = await this.supabase.storage
        .from(this.bucketName)
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          upsert: true,
        });

      if (uploadError) {
        this.logger.error(`Erreur upload Supabase (fichier brut): ${uploadError.message}`);
        throw new BadRequestException('Échec du stockage du fichier. Veuillez réessayer.');
      }

      const { data } = this.supabase.storage.from(this.bucketName).getPublicUrl(fileName);
      return { url: data.publicUrl, type: file.mimetype, name: file.originalname };
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsDir, { recursive: true });
    const filePath = path.join(uploadsDir, fileName);
    await fs.promises.writeFile(filePath, file.buffer);
    const apiUrl = process.env.API_URL ?? 'http://localhost:5500';

    return { url: `${apiUrl}/uploads/${fileName}`, type: file.mimetype, name: file.originalname };
  }

  /**
   * Enregistre un QR code créé dans le créateur du site (lien web, Wi-Fi, texte…), quel que soit son contenu.
   * Les liens (http/https) sont gratuits, même sans compte ; tout autre contenu exige un compte Premium (ou administrateur).
   * Un même contenu et un même style, créés par le même compte, ne sont enregistrés qu'une fois.
   */
  async createDirect(
    user: { id: string; role?: string } | null,
    input: { payload?: string; qrStyle?: string; title?: string },
  ) {
    const payload = (input.payload ?? '').trim();
    if (!payload || payload.length > 1500) throw new BadRequestException('Contenu du QR code manquant ou trop long.');
    const isLink = /^https?:\/\/\S+$/i.test(payload);
    if (!isLink) {
      let premium = user?.role === 'admin';
      if (user && !premium) {
        const owner = await this.prisma.adminUser.findUnique({ where: { id: user.id }, select: { premiumUntil: true } });
        premium = Boolean(owner?.premiumUntil && owner.premiumUntil.getTime() > Date.now());
      }
      if (!premium) throw new ForbiddenException('Ce contenu exige un compte Premium : seuls les liens sont gratuits.');
    }
    if (user) {
      const same = await this.prisma.card.findFirst({
        where: { ownerId: user.id, serviceType: 'direct', contentUrl: payload, status: 'active' },
        orderBy: { id: 'desc' },
      });
      if (same) return { slug: same.slug, saved: false };
    }
    let title = (input.title ?? '').trim().slice(0, 80);
    if (!title) {
      try {
        title = isLink ? new URL(payload).hostname : payload.split(/[:\n;]/)[0].slice(0, 40);
      } catch {
        title = 'QR code';
      }
    }
    const created = await this.createCard(
      {},
      { serviceType: 'direct', directPayload: payload, title, qrStyle: input.qrStyle, clientName: title },
      user?.id ?? null,
      { status: 'active' },
    );
    return { slug: created.slug, saved: true };
  }

  async createCard(
    files: UploadedCardFiles,
    metadata?: CardMetadata,
    ownerId?: string | null,
    options: { status?: 'draft' | 'active' } = {},
  ) {
    const serviceType: CardServiceType =
      metadata?.serviceType === 'media' || metadata?.serviceType === 'document' || metadata?.serviceType === 'direct'
        ? metadata.serviceType
        : 'page';

    const hasPageFiles = files.file || files.logo || (files.menu && files.menu.length > 0);
    const hasMediaFile = !!files.media;
    const hasDocumentFile = !!files.document;

    if (serviceType === 'page' && !hasPageFiles) {
      throw new BadRequestException('Aucun fichier fourni');
    }
    if (serviceType === 'media' && !hasMediaFile) {
      throw new BadRequestException("Veuillez fournir une image ou une vidéo pour générer le QR code.");
    }
    if (serviceType === 'document' && !hasDocumentFile) {
      throw new BadRequestException('Veuillez fournir un document PDF pour générer le QR code.');
    }
    const directPayload = metadata?.directPayload?.trim() ?? '';
    if (serviceType === 'direct' && (!directPayload || directPayload.length > 1500)) {
      throw new BadRequestException('Contenu du QR code manquant ou trop long.');
    }

    // 1. Génération d'un slug unique (8 caractères alphanumériques)
    let slug = '';
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let isUnique = false;
    while (!isUnique) {
      slug = Array.from({ length: 8 }, () =>
        chars.charAt(Math.floor(Math.random() * chars.length)),
      ).join('');
      const existing = await this.prisma.card.findUnique({
        where: { slug },
      });
      if (!existing) {
        isUnique = true;
      }
    }

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const cardUrl = `${appUrl}/c/${slug}`;

    let logoUrl: string | null = null;
    const menuImagesUrls: string[] = [];
    const placeImagesUrls: string[] = [];
    let primaryImageUrl = '';
    let contentUrl: string | null = null;
    let contentType: string | null = null;
    let fileName: string | null = null;

    if (serviceType === 'page') {
      // 2. Traitement et upload des images (Logo et/ou Menu)
      if (files.logo) {
        logoUrl = await this.processAndUploadImage(files.logo.buffer, `${slug}-logo.webp`);
      } else if (files.file) {
        logoUrl = await this.processAndUploadImage(files.file.buffer, `${slug}.webp`);
      }
      if (files.menu && files.menu.length > 0) {
        for (let i = 0; i < files.menu.length; i++) {
          const menuFile = files.menu[i];
          const menuUrl = await this.processAndUploadImage(menuFile.buffer, `${slug}-menu-${i}.webp`);
          menuImagesUrls.push(menuUrl);
        }
      }
      if (files.place && files.place.length > 0) {
        for (let i = 0; i < files.place.length; i++) {
          const placeFile = files.place[i];
          const placeUrl = await this.processAndUploadImage(placeFile.buffer, `${slug}-place-${i}.webp`);
          placeImagesUrls.push(placeUrl);
        }
      }
      primaryImageUrl = logoUrl || menuImagesUrls[0] || '';
    } else if (serviceType === 'media' && files.media) {
      const stored = await this.storeRawFile(files.media, `${slug}-media`);
      contentUrl = stored.url;
      contentType = stored.type;
      fileName = stored.name;
      // Aperçu minimal pour l'interface admin/compte
      if (stored.type.startsWith('image/')) {
        primaryImageUrl = stored.url;
      }
    } else if (serviceType === 'document' && files.document) {
      const stored = await this.storeRawFile(files.document, `${slug}-doc`);
      contentUrl = stored.url;
      contentType = stored.type;
      fileName = stored.name;
      primaryImageUrl = logoUrl || '';
    }

    if (serviceType === 'direct') {
      // Le contenu du QR est conservé tel quel ; aucune page n'est hébergée.
      contentUrl = directPayload;
      contentType = 'direct';
      if (files.logo) logoUrl = await this.processAndUploadImage(files.logo.buffer, `${slug}-logo.webp`);
    }

    if (!primaryImageUrl && !contentUrl) {
      throw new BadRequestException('Aucun fichier exploitable n\'a été fourni.');
    }

    // 3. Génération du QR code selon le style choisi
    const qrCode = await this.generateStyledQrCode(
      serviceType === 'direct' ? directPayload : cardUrl,
      normalizeQrStyle(metadata?.qrStyle),
    );
    // Validation de sécurité de l'URL de localisation (protection anti-XSS)
    let safeLocationUrl: string | null = null;
    if (metadata?.locationUrl) {
      const trimmedLocation = metadata.locationUrl.trim();
      if (trimmedLocation.startsWith('http://') || trimmedLocation.startsWith('https://')) {
        safeLocationUrl = trimmedLocation;
      }
    }
    // Helper de normalisation : convertit les chaînes vides ou avec espaces seuls en null
    const cleanStr = (val?: string | null): string | null =>
      val && val.trim().length > 0 ? val.trim() : null;
    // 4. Enregistrement dans PostgreSQL via Prisma
    const createData: Prisma.CardUncheckedCreateInput = {
      slug,
      imageUrl: primaryImageUrl || contentUrl || '',
      ownerId: ownerId || null,
      serviceType,
      title: cleanStr(metadata?.title),
      contentUrl,
      contentType,
      fileName,
      restaurantName: cleanStr(metadata?.restaurantName),
      address: cleanStr(metadata?.address),
      logoUrl: logoUrl ?? null,
      locationUrl: safeLocationUrl,
      phoneNumber: cleanStr(metadata?.phoneNumber),
      menuImages: serviceType === 'page' && menuImagesUrls.length > 0 ? JSON.stringify(menuImagesUrls) : null,
      placeImages: serviceType === 'page' && placeImagesUrls.length > 0 ? JSON.stringify(placeImagesUrls) : null,
      // Vide = palette par défaut de la disposition (voir apps/web/lib/palette.ts).
      themeId: cleanStr(metadata?.themeId) ?? '',
      cardLayout: cleanStr(metadata?.cardLayout) ?? 'classic',
      qrStyle: normalizeQrStyle(cleanStr(metadata?.qrStyle)),
      userName: cleanStr(metadata?.userName),
      clientName: cleanStr(metadata?.clientName),
      workDone: cleanStr(metadata?.workDone),
      amountReceived: metadata?.amountReceived !== undefined && metadata.amountReceived !== null ? Number(metadata.amountReceived) : null,
      currency: cleanStr(metadata?.currency) ?? 'fcfa',
      facebookUrl: safeHttpUrl(metadata?.facebookUrl),
      instagramUrl: safeHttpUrl(metadata?.instagramUrl),
      xUrl: safeHttpUrl(metadata?.xUrl),
      snapchatUrl: safeHttpUrl(metadata?.snapchatUrl),
      additionalInfo: cleanStr(metadata?.additionalInfo),
      schedule: parseSchedule(metadata?.schedule) ?? Prisma.JsonNull,
      status: options.status ?? 'active',
    };
    const card: Card = await this.prisma.card.create({
      data: createData,
    });
    return {
      slug: card.slug,
      imageUrl: card.imageUrl,
      restaurantName: card.restaurantName ?? null,
      logoUrl: card.logoUrl ?? null,
      locationUrl: card.locationUrl ?? null,
      phoneNumber: card.phoneNumber ?? null,
      menuImages: menuImagesUrls,
      themeId: card.themeId ?? '',
      qrStyle: card.qrStyle ?? 'style-1',
      cardUrl,
      qrCode,
      createdAt: card.createdAt,
      serviceType: card.serviceType,
      title: card.title ?? null,
      contentUrl: card.contentUrl ?? null,
      contentType: card.contentType ?? null,
      fileName: card.fileName ?? null,
      status: card.status,
    };
  }

  /** Enregistre un scan d'une carte publiée (les brouillons et cartes refusées ne comptent pas). */
  async recordScan(slug: string, userAgent?: string, geo?: { country: string | null; city: string | null }): Promise<void> {
    const card = await this.prisma.card.findUnique({ where: { slug }, select: { id: true, status: true } });
    if (!card || card.status !== 'active') return;
    const ua = (userAgent ?? '').toLowerCase();
    if (/bot|crawler|spider|preview|facebookexternalhit|whatsapp/.test(ua)) return;
    const device = /iphone|ipad|ipod/.test(ua)
      ? 'ios'
      : /android/.test(ua)
        ? 'android'
        : /windows|macintosh|linux|cros/.test(ua)
          ? 'desktop'
          : 'other';
    await this.prisma.cardScan.create({ data: { cardId: card.id, device, country: geo?.country ?? null, city: geo?.city ?? null } });
  }

  /** QR code (data URL PNG) d'une carte, dans le style enregistré. */
  /** La carte d'un compte (ou n'importe laquelle pour un administrateur) ; sinon introuvable. */
  async findOwnedBy(slug: string, userId: string, admin: boolean) {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card || (!admin && card.ownerId !== userId)) throw new NotFoundException('QR code introuvable.');
    return card;
  }

  async getQrCode(slug: string): Promise<{ qrCode: string; cardUrl: string }> {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card) throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    const cardUrl = `${appUrl}/c/${slug}`;
    const target = card.serviceType === 'direct' && card.contentUrl ? card.contentUrl : cardUrl;
    return { qrCode: await this.generateStyledQrCode(target, card.qrStyle), cardUrl: target };
  }

  /**
   * Prépare une modification sans l'appliquer : les nouveaux fichiers sont stockés
   * tout de suite, les valeurs sont renvoyées pour être appliquées après paiement.
   * Seuls les champs réellement fournis sont repris.
   */
  async prepareChanges(
    card: Card,
    files: UploadedCardFiles,
    metadata: CardMetadata = {},
  ): Promise<Prisma.CardUpdateInput> {
    const changes: Prisma.CardUpdateInput = {};
    const stamp = `${card.slug}-${Date.now()}`;
    const text = (key: keyof CardMetadata) => {
      const value = metadata[key];
      return typeof value === 'string' ? value.trim() : undefined;
    };

    for (const key of ['title', 'restaurantName', 'address', 'phoneNumber', 'additionalInfo'] as const) {
      const value = text(key);
      if (value !== undefined) changes[key] = value || null;
    }
    for (const key of ['facebookUrl', 'instagramUrl', 'xUrl', 'snapchatUrl', 'locationUrl'] as const) {
      const value = text(key);
      if (value !== undefined) changes[key] = safeHttpUrl(value);
    }
    // Palette : une valeur vide est permise (retour à la palette de la disposition).
    const themeId = text('themeId');
    if (themeId !== undefined) changes.themeId = themeId.slice(0, 80);
    const cardLayout = text('cardLayout');
    if (cardLayout) changes.cardLayout = cardLayout;
    const qrStyle = text('qrStyle');
    if (qrStyle) changes.qrStyle = normalizeQrStyle(qrStyle);
    if (metadata.schedule !== undefined) {
      changes.schedule = parseSchedule(metadata.schedule) ?? Prisma.JsonNull;
    }

    if (card.serviceType === 'page') {
      const logo = files.logo ?? files.file;
      if (logo) {
        const url = await this.processAndUploadImage(logo.buffer, `${stamp}-logo.webp`);
        changes.logoUrl = url;
        changes.imageUrl = url;
      }
      if (files.menu && files.menu.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < files.menu.length; i++) {
          urls.push(await this.processAndUploadImage(files.menu[i].buffer, `${stamp}-menu-${i}.webp`));
        }
        changes.menuImages = JSON.stringify(urls);
      }
      if (files.place && files.place.length > 0) {
        const urls: string[] = [];
        for (let i = 0; i < files.place.length; i++) {
          urls.push(await this.processAndUploadImage(files.place[i].buffer, `${stamp}-place-${i}.webp`));
        }
        changes.placeImages = JSON.stringify(urls);
      }
    } else {
      const upload = card.serviceType === 'document' ? files.document : files.media;
      if (upload) {
        const stored = await this.storeRawFile(upload, `${stamp}-${card.serviceType}`);
        changes.contentUrl = stored.url;
        changes.contentType = stored.type;
        changes.fileName = stored.name;
        if (stored.type.startsWith('image/')) changes.imageUrl = stored.url;
      }
    }

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('Aucune modification fournie.');
    }
    return changes;
  }

  /** Fiche complète pour l'administration : contenu (même non payé), commandes, paiements. */
  async getAdminDetail(slug: string) {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card) throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    const content = await this.getCardBySlug(slug, { includeDraft: true });
    const orders = await this.prisma.order.findMany({
      where: { cardId: card.id },
      orderBy: { createdAt: 'desc' },
      include: { payments: { orderBy: { createdAt: 'desc' } } },
    });
    const qr = card.status === 'active' ? await this.getQrCode(slug) : null;
    const since = new Date(Date.now() - 29 * 24 * 60 * 60 * 1000);
    since.setHours(0, 0, 0, 0);
    const [scanTotal, recentScans] = await Promise.all([
      this.prisma.cardScan.count({ where: { cardId: card.id } }),
      this.prisma.cardScan.findMany({ where: { cardId: card.id, createdAt: { gte: since } }, select: { createdAt: true, device: true } }),
    ]);
    const scanDays = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(since.getTime() + i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      count: 0,
    }));
    const byDevice: Record<string, number> = {};
    for (const scan of recentScans) {
      const key = new Date(scan.createdAt.getTime() - scan.createdAt.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
      const day = scanDays.find((d) => d.date === key);
      if (day) day.count += 1;
      byDevice[scan.device] = (byDevice[scan.device] ?? 0) + 1;
    }
    return {
      ...content,
      scans: { total: scanTotal, last30: recentScans.length, days: scanDays, byDevice },
      id: card.id.toString(),
      status: card.status,
      moderationNote: card.moderationNote,
      rejectedAt: card.rejectedAt,
      clientName: card.clientName,
      userName: card.userName,
      workDone: card.workDone,
      amountReceived: card.amountReceived,
      ownerId: card.ownerId,
      qrCode: qr?.qrCode ?? null,
      orders: orders.map(({ accessTokenHash: _hidden, ...order }) => ({ ...order, cardId: order.cardId.toString() })),
    };
  }

  /** Refuse une carte : elle n'est plus publiée, les devis encore ouverts sont annulés. */
  async rejectCard(slug: string, reason: string) {
    const note = reason?.trim();
    if (!note || note.length < 3) throw new BadRequestException('Indiquez le motif du refus (il sera montré au client).');
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card) throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    await this.prisma.$transaction([
      this.prisma.card.update({
        where: { id: card.id },
        data: { status: 'rejected', moderationNote: note.slice(0, 500), rejectedAt: new Date() },
      }),
      this.prisma.order.updateMany({
        where: { cardId: card.id, status: { in: ['quote', 'pending'] } },
        data: { status: 'cancelled' },
      }),
    ]);
    return this.getAdminDetail(slug);
  }

  /** Lève un refus : active si la création a été payée (ou faite par l'admin), sinon retour en aperçu. */
  async restoreCard(slug: string) {
    const card = await this.prisma.card.findUnique({ where: { slug } });
    if (!card) throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    const creation = await this.prisma.order.findFirst({ where: { cardId: card.id, kind: 'creation' } });
    const status = !creation || creation.status === 'paid' ? 'active' : 'draft';
    // Un devis de création annulé par le refus redevient payable.
    if (creation && creation.status === 'cancelled') {
      await this.prisma.order.update({ where: { id: creation.id }, data: { status: 'quote' } });
    }
    await this.prisma.card.update({
      where: { id: card.id },
      data: { status, moderationNote: null, rejectedAt: null },
    });
    return this.getAdminDetail(slug);
  }

  async applyChanges(cardId: bigint, changes: Prisma.CardUpdateInput) {
    return this.prisma.card.update({ where: { id: cardId }, data: changes });
  }

  async getCardBySlug(slug: string, options: { includeDraft?: boolean } = {}) {
    const card = (await this.prisma.card.findUnique({
      where: { slug },
    }));
    if (!card) {
      throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    }
    // Carte non payée ou refusée : le lien public ne révèle pas le contenu.
    if ((card.status === 'draft' || card.status === 'rejected') && !options.includeDraft) {
      return { slug: card.slug, status: card.status as 'draft' | 'rejected', serviceType: card.serviceType };
    }
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    let menuImages: string[] = [];
    if (card.menuImages) {
      try {
        menuImages = JSON.parse(card.menuImages);
      } catch {
        menuImages = [card.menuImages];
      }
    }
    let placeImages: string[] = [];
    if (card.placeImages) {
      try {
        placeImages = JSON.parse(card.placeImages);
      } catch {
        placeImages = [card.placeImages];
      }
    }
    let schedule = null;
    if (card.schedule) {
      try {
        schedule = typeof card.schedule === 'string' ? JSON.parse(card.schedule) : card.schedule;
      } catch {
        schedule = null;
      }
    }
    // Endpoint public : exclusion stricte des données d'intervention internes (userName, clientName, workDone, amountReceived)
    return {
      slug: card.slug,
      serviceType: (card.serviceType ?? 'page') as CardServiceType,
      title: card.title ?? null,
      contentUrl: card.contentUrl ?? null,
      contentType: card.contentType ?? null,
      fileName: card.fileName ?? null,
      imageUrl: card.imageUrl,
      restaurantName: card.restaurantName ?? null,
      address: card.address ?? null,
      logoUrl: card.logoUrl ?? null,
      locationUrl: card.locationUrl ?? null,
      phoneNumber: card.phoneNumber ?? null,
      facebookUrl: card.facebookUrl ?? null,
      instagramUrl: card.instagramUrl ?? null,
      xUrl: card.xUrl ?? null,
      snapchatUrl: card.snapchatUrl ?? null,
      additionalInfo: card.additionalInfo ?? null,
      schedule,
      menuImages,
      placeImages,
      themeId: card.themeId ?? '',
      cardLayout: card.cardLayout ?? 'classic',
      qrStyle: card.qrStyle ?? 'style-1',
      cardUrl: `${appUrl}/c/${card.slug}`,
      createdAt: card.createdAt,
      status: card.status,
      catalog: publicCatalog(card.catalog),
      requestMode: card.requestMode ?? 'none',
    };
  }
  async getAllCards() {
    const cards = await this.prisma.card.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { scans: true } } },
    });
    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';
    return cards.map((card) => {
      let menuImages: string[] = [];
      if (card.menuImages) {
        try {
          menuImages = JSON.parse(card.menuImages);
        } catch {
          menuImages = [card.menuImages];
        }
      }
      return {
        id: card.id.toString(),
        slug: card.slug,
        imageUrl: card.imageUrl,
        restaurantName: card.restaurantName ?? null,
        logoUrl: card.logoUrl ?? null,
        locationUrl: card.locationUrl ?? null,
        phoneNumber: card.phoneNumber ?? null,
        menuImages,
        themeId: card.themeId ?? '',
        qrStyle: card.qrStyle ?? 'style-1',
        userName: card.userName ?? null,
        clientName: card.clientName ?? null,
        workDone: card.workDone ?? null,
        amountReceived: card.amountReceived ?? null,
        currency: card.currency ?? 'fcfa',
        cardUrl: `${appUrl}/c/${card.slug}`,
        createdAt: card.createdAt,
        serviceType: (card.serviceType ?? 'page') as CardServiceType,
        title: card.title ?? null,
        contentUrl: card.contentUrl ?? null,
        contentType: card.contentType ?? null,
        fileName: card.fileName ?? null,
        ownerId: card.ownerId ?? null,
        status: card.status,
        scans: card._count.scans,
      };
    });
  }
  /** QR codes générés par un client, pour son espace personnel. */
  async getCardsByOwner(ownerId: string) {
    const cards: Card[] = await this.prisma.card.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
    });

    const appUrl = process.env.APP_URL ?? 'http://localhost:3000';

    return Promise.all(
      cards.map(async (card) => {
        const cardUrl = `${appUrl}/c/${card.slug}`;
        return {
          id: card.id.toString(),
          slug: card.slug,
          title: card.title ?? card.restaurantName ?? `QR ${card.slug}`,
          serviceType: (card.serviceType ?? 'page') as CardServiceType,
          imageUrl: card.imageUrl,
          contentUrl: card.contentUrl ?? null,
          contentType: card.contentType ?? null,
          fileName: card.fileName ?? null,
          restaurantName: card.restaurantName ?? null,
          cardUrl,
          qrCode: await this.generateStyledQrCode(
            card.serviceType === 'direct' && card.contentUrl ? card.contentUrl : cardUrl,
            card.qrStyle,
          ),
          createdAt: card.createdAt,
        };
      }),
    );
  }

  /**
   * Récupère le fichier binaire de la carte pour téléchargement direct
   */
  async getCardFile(slug: string): Promise<{ buffer: Buffer; contentType: string; filename: string }> {
    const card = await this.prisma.card.findUnique({
      where: { slug },
    });
    if (!card) {
      throw new NotFoundException(`Carte introuvable pour le slug "${slug}"`);
    }
    if (card.status === 'draft') {
      throw new ForbiddenException('Ce QR code sera téléchargeable après paiement.');
    }
    if (card.status === 'rejected') {
      throw new ForbiddenException('Ce QR code a été désactivé.');
    }
    const filename = `carte-${slug}.webp`;
    const contentType = 'image/webp';
    if (this.supabase) {
      const storageKey = card.imageUrl.includes(`/${this.bucketName}/`)
        ? card.imageUrl.split(`/${this.bucketName}/`)[1]
        : `${slug}.webp`;
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(storageKey);
      if (!error && data) {
        const arrayBuffer = await data.arrayBuffer();
        return {
          buffer: Buffer.from(arrayBuffer),
          contentType,
          filename,
        };
      }
    }
    // Si local ou si Supabase direct
    const uploadsDir = path.join(process.cwd(), 'uploads');
    const localFileName = path.basename(card.imageUrl);
    const localPath = path.join(uploadsDir, localFileName);
    if (fs.existsSync(localPath)) {
      const buffer = await fs.promises.readFile(localPath);
      return { buffer, contentType, filename };
    }
    // Repli via fetch HTTP sécurisé (Anti-SSRF & Anti-DoS)
    if (card.imageUrl.startsWith('https://')) {
      try {
        const urlObj = new URL(card.imageUrl);
        const host = urlObj.hostname;
        // 1. Liste noire basique anti-SSRF (Bloquer localhost et les IPs directes)
        const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
        const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(host) || /^[0-9a-fA-F:]+$/.test(host);
        if (isLocalhost || isIpAddress) {
          throw new Error('SSRF Bloqué : Résolution réseau interne ou IP directe interdite.');
        }
        // 2. Protection Anti-DoS (Timeout strict de 5 secondes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        const response = await fetch(card.imageUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          return {
            buffer: Buffer.from(arrayBuffer),
            contentType,
            filename,
          };
        }
      } catch (err) {
        this.logger.warn(`Échec de récupération de l'image distante (sécurité ou réseau) : ${err}`);
      }
    }
    throw new NotFoundException(`Le fichier image pour la carte "${slug}" est introuvable`);
  }
  async updateCardBySlug(slug: string, rawData: object, files?: { file?: Express.Multer.File[]; logo?: Express.Multer.File[]; menu?: Express.Multer.File[]; place?: Express.Multer.File[]; media?: Express.Multer.File[]; document?: Express.Multer.File[]; }) {
    const existing = await this.prisma.card.findUnique({ where: { slug } });
    if (!existing) {
      throw new NotFoundException(`La carte "${slug}" n'existe pas`);
    }
    // Seuls ces champs sont modifiables (le statut passe par rejet / réactivation).
    // Champs dynamiques, filtrés par UPDATABLE_FIELDS puis validés un à un ci-dessous.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    const input = rawData as Record<string, unknown>;
    for (const key of UPDATABLE_FIELDS) {
      if (input?.[key] !== undefined) updateData[key] = input[key];
    }
    for (const key of ['facebookUrl', 'instagramUrl', 'xUrl', 'snapchatUrl', 'locationUrl']) {
      if (typeof updateData[key] === 'string') updateData[key] = safeHttpUrl(updateData[key]);
    }
    if (typeof updateData.qrStyle === 'string') updateData.qrStyle = normalizeQrStyle(updateData.qrStyle);
    for (const key of ['title', 'restaurantName', 'address', 'phoneNumber', 'additionalInfo', 'clientName', 'userName', 'workDone']) {
      if (typeof updateData[key] === 'string') updateData[key] = updateData[key].trim() || null;
    }
    if (updateData.schedule !== undefined) {
      updateData.schedule = parseSchedule(updateData.schedule) ?? Prisma.JsonNull;
    }
    const upload = files?.media?.[0] ?? files?.document?.[0];
    if (upload && existing.serviceType !== 'page') {
      const stored = await this.storeRawFile(upload, `${slug}-${existing.serviceType}`);
      updateData.contentUrl = stored.url;
      updateData.contentType = stored.type;
      updateData.fileName = stored.name;
      if (stored.type.startsWith('image/')) updateData.imageUrl = stored.url;
    }
    // Les champs multipart arrivent en texte : Prisma attend un Float.
    if (updateData.amountReceived !== undefined) {
      const raw = String(updateData.amountReceived).replace(/[^\d.,-]/g, '').replace(',', '.');
      const amount = raw === '' ? null : Number(raw);
      updateData.amountReceived = amount === null || Number.isNaN(amount) ? null : amount;
    }
    // Images : Supabase si configuré, sinon dossier local uploads/ (géré par processAndUploadImage).
    {
      const deleteOldFile = async (oldUrl: string | null) => {
        if (this.supabase && oldUrl && oldUrl.includes('supabase.co')) {
          const path = oldUrl.split('/images/')[1];
          if (path) {
            await this.supabase!.storage.from('images').remove([path]).catch(() => {});
          }
        }
      };
      if (files?.file && files.file.length > 0) {
        const file = files.file[0];
        await deleteOldFile(existing.imageUrl);
        updateData.imageUrl = await this.processAndUploadImage(file.buffer, `card-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`);
      }
      if (files?.logo && files.logo.length > 0) {
        const logo = files.logo[0];
        await deleteOldFile(existing.logoUrl);
        updateData.logoUrl = await this.processAndUploadImage(logo.buffer, `logo-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`);
      }
      if (existing.serviceType === 'page') {
      let finalMenuImages: string[] = [];
      let keptUrls: string[] = [];
      if (updateData.existingMenuUrls !== undefined) {
        try {
          keptUrls = typeof updateData.existingMenuUrls === 'string' 
            ? JSON.parse(updateData.existingMenuUrls) 
            : updateData.existingMenuUrls;
        } catch {
          keptUrls = [];
        }
      } else {
        keptUrls = existing.menuImages ? JSON.parse(existing.menuImages as string) : [];
      }
      delete updateData.existingMenuUrls;
      if (existing.menuImages) {
        const oldUrls = JSON.parse(existing.menuImages as string) as string[];
        const toDelete = oldUrls.filter(url => !keptUrls.includes(url));
        if (toDelete.length > 0) {
          await Promise.all(toDelete.map(url => deleteOldFile(url)));
        }
      }
      finalMenuImages = [...keptUrls];
      if (files?.menu && files.menu.length > 0) {
        const uploadPromises = files.menu.map(async (menuFile) => {
          return await this.processAndUploadImage(menuFile.buffer, `menu-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`);
        });
        const results = await Promise.all(uploadPromises);
        finalMenuImages.push(...(results.filter(url => url !== null) as string[]));
      }
      updateData.menuImages = JSON.stringify(finalMenuImages);
      let finalPlaceImages: string[] = [];
      let keptPlaceUrls: string[] = [];
      if (updateData.existingPlaceUrls !== undefined) {
        try {
          keptPlaceUrls = typeof updateData.existingPlaceUrls === 'string' 
            ? JSON.parse(updateData.existingPlaceUrls) 
            : updateData.existingPlaceUrls;
        } catch {
          keptPlaceUrls = [];
        }
      } else {
        keptPlaceUrls = existing.placeImages ? JSON.parse(existing.placeImages as string) : [];
      }
      delete updateData.existingPlaceUrls;
      if (existing.placeImages) {
        const oldPlaceUrls = JSON.parse(existing.placeImages as string) as string[];
        const toDeletePlace = oldPlaceUrls.filter(url => !keptPlaceUrls.includes(url));
        if (toDeletePlace.length > 0) {
          await Promise.all(toDeletePlace.map(url => deleteOldFile(url)));
        }
      }
      finalPlaceImages = [...keptPlaceUrls];
      if (files?.place && files.place.length > 0) {
        const uploadPlacePromises = files.place.map(async (placeFile) => {
          return await this.processAndUploadImage(placeFile.buffer, `place-${Date.now()}-${Math.random().toString(36).substring(7)}.webp`);
        });
        const resultsPlace = await Promise.all(uploadPlacePromises);
        finalPlaceImages.push(...(resultsPlace.filter(url => url !== null) as string[]));
      }
      updateData.placeImages = JSON.stringify(finalPlaceImages);
      }
    }
    delete updateData.existingMenuUrls;
    delete updateData.existingPlaceUrls;
    const updatedCard = await this.prisma.card.update({
      where: { slug },
      data: updateData,
    });
    return updatedCard;
  }

  async deleteCardBySlug(slug: string, user: { id: string; role: 'admin' | 'user' }) {
    const existing = await this.prisma.card.findUnique({ where: { slug } });
    if (!existing) {
      throw new NotFoundException(`La carte "${slug}" n'existe pas`);
    }

    if (user.role !== 'admin' && existing.ownerId !== user.id) {
      throw new ForbiddenException("Vous ne pouvez supprimer que vos propres QR codes.");
    }

    if (this.supabase) {
      const pathsToDelete: string[] = [];
      const addPath = (url: string | null) => {
        if (url && url.includes('/storage/v1/object/public/visicard/')) {
          pathsToDelete.push(url.split('/storage/v1/object/public/visicard/')[1]);
        }
      };

      addPath(existing.imageUrl);
      addPath(existing.logoUrl);
      addPath(existing.contentUrl);
      if (existing.menuImages) {
        try {
          const arr = JSON.parse(existing.menuImages);
          arr.forEach(addPath);
        } catch { addPath(existing.menuImages); }
      }
      if (existing.placeImages) {
        try {
          const arr = JSON.parse(existing.placeImages);
          arr.forEach(addPath);
        } catch { addPath(existing.placeImages); }
      }

      if (pathsToDelete.length > 0) {
        await this.supabase.storage.from('visicard').remove(pathsToDelete);
      }
    } else {
      const uploadsDir = path.join(process.cwd(), 'uploads');
      
      const deleteLocal = (url: string | null) => {
        if (url) {
          const fileName = path.basename(url);
          const localPath = path.join(uploadsDir, fileName);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        }
      };

      deleteLocal(existing.imageUrl);
      deleteLocal(existing.logoUrl);
      deleteLocal(existing.contentUrl);
      if (existing.menuImages) {
        try { JSON.parse(existing.menuImages).forEach(deleteLocal); } catch { /* liste illisible : rien à supprimer */ }
      }
      if (existing.placeImages) {
        try { JSON.parse(existing.placeImages).forEach(deleteLocal); } catch { /* liste illisible : rien à supprimer */ }
      }
    }

    await this.prisma.card.delete({ where: { slug } });
    return { success: true, message: `Carte ${slug} supprimée avec succès` };
  }

}

/** Garde une URL http(s) propre, sinon null (protection contre javascript: & co). */
function safeHttpUrl(value?: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : null;
}

/** Les horaires arrivent en JSON texte depuis un formulaire multipart. */
function parseSchedule(value?: unknown): Prisma.InputJsonValue | null {
  if (!value) return null;
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed && typeof parsed === 'object' ? (parsed as Prisma.InputJsonValue) : null;
  } catch {
    return null;
  }
}

const UPDATABLE_FIELDS = [
  'title', 'restaurantName', 'address', 'locationUrl', 'phoneNumber', 'facebookUrl', 'instagramUrl', 'xUrl',
  'snapchatUrl', 'schedule', 'additionalInfo', 'themeId', 'cardLayout', 'qrStyle', 'clientName', 'userName',
  'workDone', 'amountReceived', 'existingMenuUrls', 'existingPlaceUrls',
] as const;
