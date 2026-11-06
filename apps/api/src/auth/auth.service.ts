import { Injectable, Logger, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { PrismaService } from '../database/prisma.service';
import { hashPassword, verifyPassword } from './mot-de-passe';
import { createLocalToken, readLocalToken } from './jetons-locaux';

export interface AuthSessionUser {
  id: string;
  email?: string;
  role: 'admin' | 'user';
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
  }): AuthSessionUser {
    return {
      id: account.id,
      email: account.email,
      role: account.role === 'admin' ? 'admin' : 'user',
      provider: 'local',
    };
  }

  private issueLocalSession(account: {
    id: string;
    email: string;
    role: string;
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

  async loginAdmin(password: string): Promise<AuthResult> {
    return this.login('admin', password);
  }

  /**
   * Création d'un compte client. Les comptes vivent dans la même table que les
   * administrateurs (`admin_users`, champ `role`) afin qu'une personne puisse
   * être promue administrateur plus tard depuis l'interface.
   */
  async register(name: string, email: string, password: string): Promise<AuthResult> {
    const cleanName = (name || '').trim();
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
          name: cleanName || null,
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
    if (account.id === actingUserId) {
      throw new BadRequestException('Vous ne pouvez pas supprimer votre propre compte.');
    }
    if (account.role === 'admin') {
      const admins = await this.prisma.adminUser.count({ where: { role: 'admin' } });
      if (admins <= 1) throw new BadRequestException('Impossible de supprimer le dernier administrateur.');
    }
    const paid = await this.prisma.order.count({ where: { userId: accountId, status: 'paid' } });
    if (paid > 0) {
      throw new BadRequestException('Ce compte a des commandes payées : il ne peut pas être supprimé.');
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
