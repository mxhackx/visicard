import { Injectable, Logger, UnauthorizedException, BadRequestException, ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, verifyPassword } from './mot-de-passe';
import { createLocalToken, readLocalToken } from './jetons-locaux';
import { verifyGoogleCredential } from './google';
import { createHash, randomBytes } from 'node:crypto';
import { sendPasswordReset } from '../account/notify';

export interface AuthSessionUser {
  id: string;
  email?: string;
  role: 'admin' | 'user';
  name?: string | null;
  /** Photo de profil (comptes Google). */
  picture?: string | null;
  /** Téléphone du compte (+indicatif). */
  phone?: string | null;
  /**
   * Émetteur de la session : `supabase` pour le chemin d'origine, `local` pour
   * un compte de la table `admin_users`. Absent sur les sessions plus anciennes.
   */
  provider?: 'local' | 'supabase';
}

export interface AuthResult {
  access_token: string;
  refresh_token: string;
  user: AuthSessionUser;
  redirect: string;
}

export interface RefreshResult {
  access_token: string;
  refresh_token: string;
  user: AuthSessionUser;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private supabase: SupabaseClient | null = null;

  constructor(private readonly prisma: PrismaService) {
    this.logger.log('Initialisation du AuthService (Supabase + comptes admin locaux)');
  }

  async onModuleInit() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      this.logger.warn(
        "Configuration Supabase manquante (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) : " +
          "seuls les comptes de la table admin_users pourront se connecter.",
      );
      return;
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    this.logger.log('Connecté à Supabase Auth avec succès. Fin de la dépendance aux mots de passe locaux.');
  }

  /**
   * Un compte local est une simple ligne de `admin_users` : sa lecture doit
   * échouer doucement quand la table n'existe pas encore (base fraîche,
   * migration non jouée), sans jamais empêcher le chemin Supabase.
   */
  private async findLocalAccount(email: string) {
    try {
      return await this.prisma.adminUser.findUnique({ where: { email } });
    } catch (error) {
      this.logger.debug(`admin_users indisponible : ${(error as Error).message}`);
      return null;
    }
  }

  /** Nombre de comptes locaux, ou `null` quand la table est absente. */
  private async countLocalAccounts(): Promise<number | null> {
    try {
      return await this.prisma.adminUser.count();
    } catch {
      return null;
    }
  }

  private localSessionUser(account: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    pictureUrl?: string | null;
    phone?: string | null;
  }): AuthSessionUser {
    return {
      id: account.id,
      email: account.email,
      role: account.role === 'admin' ? 'admin' : 'user',
      name: account.name ?? null,
      picture: account.pictureUrl ?? null,
      phone: account.phone ?? null,
      provider: 'local',
    };
  }

  private issueLocalSession(account: {
    id: string;
    email: string;
    role: string;
    name?: string | null;
    pictureUrl?: string | null;
    phone?: string | null;
  }) {
    const user = this.localSessionUser(account);
    const target = { id: user.id, email: user.email ?? '', role: user.role };

    return {
      access_token: createLocalToken(target, 'access'),
      refresh_token: createLocalToken(target, 'refresh'),
      user,
    };
  }

  async login(identifier: string, password: string): Promise<AuthResult> {
    const cleanId = (identifier || '').trim().toLowerCase();
    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase();
    const userEmail = (process.env.USER_EMAIL || 'user@moncode.com').toLowerCase();

    let targetEmail = cleanId;

    if (!cleanId || cleanId === 'admin') {
      targetEmail = adminEmail;
    } else if (cleanId === 'user' || cleanId === 'restaurant' || cleanId === 'resto') {
      targetEmail = userEmail;
    }

    // 1) Un compte présent dans `admin_users` a toujours la main : c'est lui qui
    //    permet de démarrer l'API sans Supabase. Le faire passer après Supabase
    //    rendrait `ADMIN_PASSWORD` inopérant dès lors qu'un projet Supabase est
    //    configuré avec la même adresse.
    const account = await this.findLocalAccount(targetEmail);

    if (account) {
      const valid = await verifyPassword(password, account.passwordHash);

      if (!valid) {
        this.logger.warn(`Mot de passe incorrect pour le compte local ${targetEmail}`);
        throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
      }

      const session = this.issueLocalSession(account);
      const redirect = session.user.role === 'admin' ? '/admin' : '/compte';

      this.logger.log(`Connexion locale : ${targetEmail} (${session.user.role})`);

      return { ...session, redirect };
    }

    // 2) Aucun compte local pour cette adresse : on retombe sur Supabase.
    if (!this.supabase) {
      const localCount = await this.countLocalAccounts();

      if (localCount === null) {
        throw new UnauthorizedException(
          "Service d'authentification indisponible : ni Supabase configuré, ni table " +
            'admin_users en base. Créez la base puis jouez `npm run seed`.',
        );
      }
      if (localCount === 0) {
        throw new UnauthorizedException(
          'Aucun compte en base : renseignez ADMIN_EMAIL et ADMIN_PASSWORD dans .env ' +
            'puis lancez `npm run seed`.',
        );
      }

      throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    }

    const { data, error } = await this.supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Identifiant ou mot de passe incorrect');
    }

    // Déduction Intelligente du Rôle (Auto-Healing)
    let role: 'admin' | 'user' = data.user.user_metadata?.role as 'admin' | 'user';
    
    if (!role) {
      // Si le rôle n'est pas explicitement défini dans les métadonnées Supabase
      if (data.user.email?.toLowerCase() === userEmail) {
        role = 'user';
      } else {
        // Si l'email connecté ne correspond pas à l'email générique de l'intervenant,
        // c'est forcément l'administrateur (qui a potentiellement changé son email).
        role = 'admin';
      }
      
      // Auto-réparation : on enregistre définitivement le rôle dans Supabase
      try {
        await this.supabase.auth.admin.updateUserById(data.user.id, {
          user_metadata: { role }
        });
        this.logger.log(`Auto-healing: Rôle ${role} défini pour ${data.user.email}`);
      } catch {
        this.logger.warn(`Impossible de mettre à jour les métadonnées pour ${data.user.email}`);
      }
    }

    const redirect = role === 'admin' ? '/admin' : '/compte';

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        provider: 'supabase',
      },
      redirect,
    };
  }

  /**
   * Connexion avec Google : le jeton est confirmé par Google, puis le compte est retrouvé par son
   * adresse e-mail (vérifiée) ou créé. Un compte créé ainsi n'a pas de mot de passe utilisable.
   */
  async loginWithGoogle(credential: string): Promise<AuthResult> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new ServiceUnavailableException('La connexion avec Google n’est pas encore activée.');
    const profile = await verifyGoogleCredential(credential, clientId);

    let account = await this.findLocalAccount(profile.email);
    if (account) {
      // Nom et photo suivent le profil Google ; le nom saisi à l'inscription n'est jamais écrasé.
      account = await this.prisma.adminUser.update({
        where: { id: account.id },
        data: { pictureUrl: profile.picture, ...(account.name ? {} : { name: profile.name }) },
      });
    } else {
      account = await this.prisma.adminUser.create({
        data: {
          email: profile.email,
          name: profile.name,
          pictureUrl: profile.picture,
          passwordHash: await hashPassword(randomBytes(32).toString('hex')),
          role: 'user',
        },
      });
      this.logger.log(`Nouveau compte client (Google) : ${profile.email}`);
    }
    const session = this.issueLocalSession(account);
    return { ...session, redirect: account.role === 'admin' ? '/admin' : '/compte' };
  }

  /** Nom et photo d'un compte local (pour /auth/me : le jeton n'en contient pas). */
  async profileOf(userId: string): Promise<{ name: string | null; picture: string | null; phone: string | null }> {
    try {
      const a = await this.prisma.adminUser.findUnique({ where: { id: userId }, select: { name: true, pictureUrl: true, phone: true } });
      return { name: a?.name ?? null, picture: a?.pictureUrl ?? null, phone: a?.phone ?? null };
    } catch {
      return { name: null, picture: null, phone: null };
    }
  }

  /**
   * Téléphone au format `+indicatif…`. Un numéro local de 8 ou 10 chiffres est béninois (+229) ;
   * un numéro commençant par `+` ou `00` garde son indicatif (8 à 15 chiffres au total).
   */
  normalizePhone(raw: string): string {
    const text = String(raw ?? '').trim();
    const international = /^(\+|00)/.test(text);
    const digits = text.replace(/\D/g, '').replace(/^00/, '');
    let full: string;
    if (international) full = digits;
    else if (digits.startsWith('229') && (digits.length === 11 || digits.length === 13)) full = digits;
    else if (digits.length === 8 || digits.length === 10) full = `229${digits}`;
    else full = '';
    if (!/^\d{8,15}$/.test(full)) {
      throw new BadRequestException('Numéro de téléphone invalide : indiquez votre numéro avec l’indicatif (ex. +229 01 97 00 00 00).');
    }
    return `+${full}`;
  }

  /**
   * Mot de passe oublié : envoie un lien valable une heure. La réponse est toujours la même, que l'adresse existe ou non
   * (on ne révèle pas quels comptes existent). Un seul lien actif par compte : un nouveau remplace l'ancien.
   */
  async requestPasswordReset(email: string): Promise<void> {
    const clean = (email || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return;
    const account = await this.findLocalAccount(clean);
    if (!account) return;
    const token = randomBytes(32).toString('base64url');
    await this.prisma.adminUser.update({
      where: { id: account.id },
      data: { resetTokenHash: createHash('sha256').update(token).digest('hex'), resetExpiresAt: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const app = (process.env.APP_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
    const link = `${app}/?reinit=${encodeURIComponent(token)}`;
    const sent = await sendPasswordReset(account.email, account.name, link);
    // Sans service e-mail (développement), le lien est consigné pour pouvoir tester.
    if (!sent) this.logger.warn(`Lien de réinitialisation pour ${account.email} (e-mail non envoyé) : ${link}`);
  }

  /** Choisit un nouveau mot de passe avec le lien reçu ; le lien est consommé et ne sert qu'une fois. */
  async resetPassword(token: string, password: string): Promise<void> {
    if (!token || (password || '').length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères.');
    }
    const hash = createHash('sha256').update(token).digest('hex');
    const account = await this.prisma.adminUser.findFirst({ where: { resetTokenHash: hash } });
    if (!account || !account.resetExpiresAt || account.resetExpiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Ce lien est invalide ou a expiré : demandez-en un nouveau.');
    }
    await this.prisma.adminUser.update({
      where: { id: account.id },
      data: { passwordHash: await hashPassword(password), resetTokenHash: null, resetExpiresAt: null },
    });
    this.logger.log(`Mot de passe réinitialisé : ${account.email}`);
  }

  /** Complète ou corrige le profil du compte connecté : nom et téléphone. */
  async updateProfile(userId: string, input: { name?: string; phone?: string }) {
    const data: { name?: string; phone?: string } = {};
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (name.length < 2) throw new BadRequestException('Indiquez votre nom et prénom.');
      data.name = name.slice(0, 120);
    }
    if (input.phone !== undefined) data.phone = this.normalizePhone(input.phone);
    if (Object.keys(data).length === 0) throw new BadRequestException('Aucune modification.');
    const account = await this.prisma.adminUser.update({ where: { id: userId }, data });
    return { id: account.id, email: account.email, name: account.name, phone: account.phone, picture: account.pictureUrl ?? null };
  }

  async loginAdmin(password: string): Promise<AuthResult> {
    return this.login('admin', password);
  }

  /**
   * Création d'un compte client. Les comptes vivent dans la même table que les
   * administrateurs (`admin_users`, champ `role`) afin qu'une personne puisse
   * être promue administrateur plus tard depuis l'interface.
   */
  async register(name: string, email: string, password: string, phone: string): Promise<AuthResult> {
    const cleanName = (name || '').trim();
    if (cleanName.length < 2) throw new BadRequestException('Indiquez votre nom et prénom.');
    const cleanPhone = this.normalizePhone(phone);
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = password || '';

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      throw new BadRequestException('Adresse e-mail invalide.');
    }
    if (cleanPassword.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères.');
    }

    const existing = await this.findLocalAccount(cleanEmail);
    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.');
    }

    try {
      const account = await this.prisma.adminUser.create({
        data: {
          email: cleanEmail,
          name: cleanName,
          phone: cleanPhone,
          passwordHash: await hashPassword(cleanPassword),
          role: 'user',
        },
      });

      const session = this.issueLocalSession(account);
      this.logger.log(`Nouveau compte client : ${cleanEmail}`);

      return { ...session, redirect: '/compte' };
    } catch (error) {
      this.logger.error(`Création du compte impossible : ${(error as Error).message}`);
      throw new BadRequestException(
        'Impossible de créer le compte pour le moment. Réessayez dans un instant.',
      );
    }
  }

  /** Domaines jetables ou d'exemple : presque toujours de faux comptes. */
  private static readonly FAKE_DOMAINS =
    /@(example\.(com|org|net)|test\.(com|fr|dev)|mailinator\.com|yopmail\.(com|fr)|guerrillamail\.com|tempmail\.[a-z]+|10minutemail\.com|trashmail\.com|fake\.[a-z]+)$/i;

  /** Liste des comptes, réservée au panneau d'administration. */
  async listAccounts() {
    const accounts = await this.prisma.adminUser.findMany({
      orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        premiumUntil: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { cards: true } },
      },
    });

    const orders = await this.prisma.order.findMany({
      where: { userId: { in: accounts.map((a) => a.id) } },
      select: { userId: true, status: true, amount: true, createdAt: true },
    });
    const byUser = new Map<
      string,
      { orders: number; paid: number; spent: number; last: Date | null }
    >();
    for (const order of orders) {
      if (!order.userId) continue;
      const row = byUser.get(order.userId) ?? { orders: 0, paid: 0, spent: 0, last: null };
      row.orders += 1;
      if (order.status === 'paid') {
        row.paid += 1;
        row.spent += order.amount;
      }
      if (!row.last || order.createdAt > row.last) row.last = order.createdAt;
      byUser.set(order.userId, row);
    }

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return accounts.map((account) => {
      const stats = byUser.get(account.id) ?? { orders: 0, paid: 0, spent: 0, last: null };
      const isAdmin = account.role === 'admin';
      const idle = stats.orders === 0 && account._count.cards === 0;
      const reasons: string[] = [];
      if (!isAdmin && AuthService.FAKE_DOMAINS.test(account.email)) reasons.push('Adresse jetable ou d’exemple');
      if (!isAdmin && idle && account.createdAt.getTime() < weekAgo) reasons.push('Aucune activité depuis plus de 7 jours');
      return {
        id: account.id,
        email: account.email,
        name: account.name,
        role: isAdmin ? 'admin' : 'user',
        premiumUntil: account.premiumUntil,
        cardsCount: account._count.cards,
        ordersCount: stats.orders,
        paidOrdersCount: stats.paid,
        totalPaid: stats.spent,
        lastOrderAt: stats.last,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        suspect: reasons.length > 0 && stats.paid === 0,
        suspectReasons: stats.paid === 0 ? reasons : [],
      };
    });
  }

  /**
   * Modification d'un compte par un administrateur : nom, e-mail, mot de passe, fin de Premium.
   * Deuxième garde-fou côté serveur : `confirmEmail` doit être l'adresse actuelle du compte (retapée par l'admin).
   * Le compte de l'administrateur principal, et ceux des autres administrateurs, ne sont modifiables que par l'administrateur principal.
   */
  async updateAccount(
    accountId: string,
    input: { name?: string; email?: string; password?: string; premiumUntil?: string | null; confirmEmail?: string },
    acting: { id: string; email?: string; role?: string },
  ) {
    const account = await this.prisma.adminUser.findUnique({ where: { id: accountId } });
    if (!account) throw new BadRequestException('Compte introuvable.');
    if ((input.confirmEmail ?? '').trim().toLowerCase() !== account.email.toLowerCase()) {
      throw new BadRequestException('Confirmation incorrecte : retapez l’adresse e-mail actuelle du compte.');
    }
    const mainEmail = (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase();
    const actingIsMain = this.isMainAdmin(acting);
    if ((account.role === 'admin' || account.email.toLowerCase() === mainEmail) && !actingIsMain && account.id !== acting.id) {
      throw new ForbiddenException('Seul l’administrateur principal peut modifier un compte administrateur.');
    }

    const data: { name?: string | null; email?: string; passwordHash?: string; premiumUntil?: Date | null } = {};
    if (input.name !== undefined) data.name = input.name.trim().slice(0, 120) || null;
    if (input.email !== undefined && input.email.trim().toLowerCase() !== account.email.toLowerCase()) {
      const email = input.email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new BadRequestException('Adresse e-mail invalide.');
      if (account.email.toLowerCase() === mainEmail) {
        throw new BadRequestException('L’adresse de l’administrateur principal se change dans ADMIN_EMAIL.');
      }
      if (await this.findLocalAccount(email)) throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.');
      data.email = email;
    }
    if (input.password) {
      if (input.password.length < 8) throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères.');
      data.passwordHash = await hashPassword(input.password);
    }
    if (input.premiumUntil !== undefined) {
      if (input.premiumUntil === null || input.premiumUntil === '') data.premiumUntil = null;
      else {
        const d = new Date(input.premiumUntil);
        if (Number.isNaN(d.getTime())) throw new BadRequestException('Date de fin de Premium invalide.');
        data.premiumUntil = d;
      }
    }
    if (Object.keys(data).length === 0) throw new BadRequestException('Aucune modification à enregistrer.');

    const updated = await this.prisma.adminUser.update({
      where: { id: accountId },
      data,
      select: { id: true, email: true, name: true, role: true, premiumUntil: true, createdAt: true },
    });
    this.logger.warn(`Compte ${account.email} modifié par ${acting.email ?? acting.id} : ${Object.keys(data).filter((k) => k !== 'passwordHash').join(', ')}${data.passwordHash ? ', mot de passe' : ''}`);
    return { ...updated, role: updated.role === 'admin' ? 'admin' : 'user' };
  }

  /** Création d'un compte par un administrateur (autre admin ou client). */
  async createAccountAsAdmin(input: { name?: string; email?: string; password?: string; role?: string }) {
    const role = input.role === 'admin' ? 'admin' : 'user';
    const email = (input.email || '').trim().toLowerCase();
    const password = input.password || '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new BadRequestException('Adresse e-mail invalide.');
    }
    if (password.length < 8) {
      throw new BadRequestException('Le mot de passe doit contenir au moins 8 caractères.');
    }
    if (await this.findLocalAccount(email)) {
      throw new BadRequestException('Un compte existe déjà avec cette adresse e-mail.');
    }
    const account = await this.prisma.adminUser.create({
      data: {
        email,
        name: (input.name || '').trim() || null,
        passwordHash: await hashPassword(password),
        role,
      },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });
    this.logger.log(`Compte ${role} créé par un administrateur : ${email}`);
    return { ...account, role: account.role === 'admin' ? 'admin' : 'user' };
  }

  /** Suppression d'un compte : jamais soi-même, jamais le dernier admin, jamais un compte qui a payé. */
  async deleteAccount(accountId: string, actingUserId?: string) {
    const account = await this.prisma.adminUser.findUnique({ where: { id: accountId } });
    if (!account) throw new BadRequestException('Compte introuvable.');
    if (account.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase()) {
      throw new BadRequestException('L’administrateur principal ne peut pas être supprimé.');
    }
    if (account.id === actingUserId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
    if (account.role === 'admin') {
      const admins = await this.prisma.adminUser.count({ where: { role: 'admin' } });
      if (admins <= 1) throw new BadRequestException('Impossible de supprimer le dernier administrateur.');
    }
    // Seuls de vrais paiements (argent encaissé) protègent un compte : une commande à 0 FCFA, créée avec Premium, n'en est pas un.
    const [paidOrders, paidPremium] = await Promise.all([
      this.prisma.order.count({ where: { userId: accountId, status: 'paid', amount: { gt: 0 } } }),
      this.prisma.premiumPurchase.count({ where: { userId: accountId, status: 'paid' } }),
    ]);
    if (paidOrders > 0 || paidPremium > 0) {
      throw new BadRequestException(
        'Ce compte a des paiements enregistrés (factures et reçus) : il ne peut pas être supprimé. Vous pouvez lui retirer Premium depuis « Modifier ».',
      );
    }
    await this.prisma.adminUser.delete({ where: { id: accountId } });
    this.logger.log(`Compte supprimé : ${account.email}`);
    return { success: true };
  }

  /** Promotion ou retrait du rôle administrateur, avec garde-fou du dernier admin. */
  async setAccountRole(accountId: string, role: string) {
    if (role !== 'admin' && role !== 'user') {
      throw new BadRequestException('Rôle inconnu : utilisez « admin » ou « user ».');
    }

    const account = await this.prisma.adminUser.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new BadRequestException('Compte introuvable.');
    }
    if (account.email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase()) {
      throw new BadRequestException('Le rôle de l’administrateur principal ne peut pas être modifié.');
    }

    if (account.role === 'admin' && role === 'user') {
      const admins = await this.prisma.adminUser.count({ where: { role: 'admin' } });
      if (admins <= 1) {
        throw new BadRequestException(
          'Impossible de retirer le dernier administrateur. Nommez un autre admin d’abord.',
        );
      }
    }

    const updated = await this.prisma.adminUser.update({
      where: { id: accountId },
      data: { role },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    return {
      ...updated,
      role: updated.role === 'admin' ? 'admin' : 'user',
    };
  }

  async refresh(refreshToken: string): Promise<RefreshResult> {
    if (!refreshToken) {
      throw new BadRequestException('Le jeton de rafraîchissement est obligatoire');
    }

    // Jeton local : le rôle est relu en base, donc supprimer la ligne révoque
    // la session au prochain rafraîchissement.
    const claims = readLocalToken(refreshToken, 'refresh');

    if (claims) {
      const account = await this.findLocalAccount(claims.email);

      if (!account) {
        throw new UnauthorizedException("Session révoquée : le compte local n'existe plus");
      }

      return this.issueLocalSession(account);
    }

    if (!this.supabase) {
      throw new UnauthorizedException('Service d\'authentification indisponible.');
    }

    const { data, error } = await this.supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Jeton de rafraîchissement invalide ou expiré');
    }

    const adminEmail = (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase();
    const role: 'admin' | 'user' = (data.user.user_metadata?.role as 'admin' | 'user') || 
      (data.user.email?.toLowerCase() === adminEmail ? 'admin' : 'user');

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
      },
    };
  }

  async validateToken(token: string): Promise<{ valid: boolean; user?: AuthSessionUser }> {
    if (!token) return { valid: false };

    // Un jeton local se vérifie sans appel réseau : on le teste en premier.
    const claims = readLocalToken(token, 'access');

    if (claims) {
      return {
        valid: true,
        user: {
          id: claims.sub,
          email: claims.email,
          role: claims.role,
          provider: 'local',
        },
      };
    }

    if (!this.supabase) return { valid: false };

    try {
      const { data, error } = await this.supabase.auth.getUser(token);
      if (!error && data?.user) {
        const adminEmail = (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase();
        const role: 'admin' | 'user' =
          (data.user.user_metadata?.role as 'admin' | 'user') ||
          (data.user.email?.toLowerCase() === adminEmail ? 'admin' : 'user');

        return {
          valid: true,
          user: {
            id: data.user.id,
            email: data.user.email,
            role,
          },
        };
      }
    } catch {
      // ignore network err
    }
    return { valid: false };
  }

  async validateAdminToken(token: string): Promise<boolean> {
    const { valid, user } = await this.validateToken(token);
    return valid && user?.role === 'admin';
  }

  /** L'administrateur principal : le compte de ADMIN_EMAIL. Lui seul nomme, retire ou crée des administrateurs. */
  isMainAdmin(user?: { email?: string; role?: string } | null): boolean {
    const main = (process.env.ADMIN_EMAIL || 'admin@moncode.com').toLowerCase();
    return user?.role === 'admin' && (user.email ?? '').toLowerCase() === main;
  }

  async validateUserToken(token: string): Promise<boolean> {
    const { valid, user } = await this.validateToken(token);
    return valid && (user?.role === 'user' || user?.role === 'admin');
  }

  async updateCredentials(token: string, newEmail?: string, newPassword?: string) {
    const { valid, user } = await this.validateToken(token);
    if (!valid || !user) {
      throw new UnauthorizedException('Session expirée ou non autorisée');
    }

    const trimmedEmail = newEmail?.trim();
    const trimmedPassword = newPassword?.trim();

    if (!trimmedEmail && !trimmedPassword) {
      throw new BadRequestException('Veuillez fournir un nouvel email ou un nouveau mot de passe');
    }

    if (user.provider === 'local') {
      const data: { email?: string; passwordHash?: string } = {};

      if (trimmedEmail) data.email = trimmedEmail.toLowerCase();
      if (trimmedPassword) data.passwordHash = await hashPassword(trimmedPassword);

      try {
        await this.prisma.adminUser.update({ where: { id: user.id }, data });
      } catch (error) {
        this.logger.error(
          `Mise à jour du compte local impossible : ${(error as Error).message}`,
        );
        throw new BadRequestException(
          'Impossible de mettre à jour les identifiants (email peut-être déjà utilisé).',
        );
      }

      return {
        success: true,
        message: 'Identifiants mis à jour dans la base.',
        user: { ...user, email: data.email ?? user.email },
      };
    }

    if (!this.supabase || !user.id) {
      throw new BadRequestException('Service d\'authentification indisponible.');
    }

    const updatePayload: Record<string, unknown> = {};
    // Auto-réparation pendant la mise à jour : on s'assure que le rôle est conservé
    updatePayload.user_metadata = { ...(user as { user_metadata?: Record<string, unknown> }).user_metadata, role: user.role };
    
    if (trimmedEmail) {
      updatePayload.email = trimmedEmail;
      updatePayload.email_confirm = true;
    }
    if (trimmedPassword) {
      updatePayload.password = trimmedPassword;
    }

    const { error: updateError } = await this.supabase.auth.admin.updateUserById(
      user.id,
      updatePayload,
    );

    if (updateError) {
      this.logger.error(`Erreur Supabase: ${updateError.message}`, updateError.stack);
      throw new BadRequestException('Impossible de mettre à jour les identifiants pour le moment.');
    }

    return {
      success: true,
      message: 'Identifiants mis à jour avec succès dans Supabase.',
      user: {
        id: user.id,
        email: trimmedEmail || user.email,
        role: user.role,
      },
    };
  }
}
