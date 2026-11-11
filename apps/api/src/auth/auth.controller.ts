import {
  Req,
  Res,
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Delete,
  Param,
  Body,
  Headers,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Jeton de session d'un appel : en-tête Bearer d'abord, puis le cookie
   * `access_token`, puis `refresh_token` par tolérance pour les appelants qui
   * ne lisent que ce dernier. Ces routes lisaient le seul cookie de
   * rafraîchissement, ce qui renvoyait 401 sur une session pourtant valide.
   */
  private sessionToken(req: Request, authHeader?: string): string | null {
    const bearer = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (bearer) return bearer;

    return req.cookies?.['access_token'] ?? req.cookies?.['refresh_token'] ?? null;
  }

  /** Pose les deux cookies de session et renvoie la charge utile inchangée. */
  private applySessionCookies(
    res: Response,
    session: { access_token: string; refresh_token: string },
  ) {
    res.cookie('access_token', session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 1000,
    });

    res.cookie('refresh_token', session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Connexion unifiée : Administrateur ou Utilisateur Restaurant
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body()
    body: {
      identifier?: string;
      email?: string;
      password?: string;
    },
    @Res({ passthrough: true }) res: Response,
  ) {
    const identifier = body?.identifier ?? body?.email ?? '';
    const password = body?.password ?? '';
    const result = await this.authService.login(identifier, password);

    this.applySessionCookies(res, result);
    return result;
  }

  /**
   * Inscription d'un client : son compte lui permet de retrouver tous les QR
   * codes qu'il a générés depuis son espace personnel.
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(
    @Body() body: { name?: string; email?: string; password?: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.register(
      body?.name ?? '',
      body?.email ?? '',
      body?.password ?? '',
    );

    this.applySessionCookies(res, result);
    return result;
  }
  
  /** Connexion ou inscription avec Google (jeton d'identité fourni par le bouton Google du site). */
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('google')
  async google(@Body() body: { credential?: string }, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginWithGoogle(body?.credential ?? '');
    this.applySessionCookies(res, result);
    return result;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    return { success: true };
  }

  /**
   * Rafraîchissement des jetons d'accès et de rafraîchissement
   */
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refresh_token') bodyRefreshToken?: string,
    @Body('refreshToken') altRefreshToken?: string,
  ) {
    let token = bodyRefreshToken ?? altRefreshToken ?? '';
    if (!token && req.cookies) {
      token = req.cookies['refresh_token'];
    }
    const result = await this.authService.refresh(token);

    this.applySessionCookies(res, result);
    return result;
  }

  /**
   * Vérification de session et profil actif via Bearer token
   */
  @Get('me')
  async getProfile(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    const token = this.sessionToken(req, authHeader);
    if (!token) {
      throw new UnauthorizedException('Token Bearer ou cookie manquant');
    }
    const { valid, user } = await this.authService.validateToken(token);

    if (!valid || !user) {
      throw new UnauthorizedException('Session expirée ou invalide');
    }

    const extra = user.provider === 'local' ? await this.authService.profileOf(user.id) : {};
    return {
      authenticated: true,
      user: { ...user, ...extra, mainAdmin: this.authService.isMainAdmin(user) },
    };
  }

  /** Liste des comptes pour l'onglet « Utilisateurs » du panneau admin. */
  @Get('accounts')
  async listAccounts(
    @Req() req: Request,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = this.sessionToken(req, authHeader);
    if (!token || !(await this.authService.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }

    return this.authService.listAccounts();
  }

  /** Crée un compte (autre administrateur ou client) depuis le panneau admin. */
  @Post('accounts')
  async createAccount(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Body() body: { name?: string; email?: string; password?: string; role?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    if (!token || !(await this.authService.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
    // Seul l'administrateur principal crée d'autres administrateurs ; les autres admins créent des clients.
    if (body?.role === 'admin') {
      const session = await this.authService.validateToken(token);
      if (!this.authService.isMainAdmin(session.user)) {
        throw new ForbiddenException('Seul l’administrateur principal peut ajouter des administrateurs.');
      }
    }
    return this.authService.createAccountAsAdmin(body ?? {});
  }

  /** Modifie un compte (nom, e-mail, mot de passe, Premium) ; exige la confirmation de l'adresse actuelle. */
  @Patch('accounts/:id')
  async updateAccount(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: { name?: string; email?: string; password?: string; premiumUntil?: string | null; confirmEmail?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    const session = token ? await this.authService.validateToken(token) : null;
    if (!session?.valid || session.user?.role !== 'admin') {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
    return this.authService.updateAccount(id, body ?? {}, session.user);
  }

  /** Supprime un compte (faux compte, doublon) avec garde-fous. */
  @Delete('accounts/:id')
  async deleteAccount(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
  ) {
    const token = this.sessionToken(req, authHeader);
    const session = token ? await this.authService.validateToken(token) : null;
    if (!session?.valid || session.user?.role !== 'admin') {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
    return this.authService.deleteAccount(id, session.user.id);
  }

  /** Nomme un client administrateur, ou lui retire ce rôle. */
  @Patch('accounts/:id/role')
  async setAccountRole(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: { role?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    const session = token ? await this.authService.validateToken(token) : null;
    if (!session?.valid || session.user?.role !== 'admin') {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
    }
    if (!this.authService.isMainAdmin(session.user)) {
      throw new ForbiddenException('Seul l’administrateur principal peut nommer ou retirer des administrateurs.');
    }

    return this.authService.setAccountRole(id, body?.role ?? '');
  }

  /**
   * Mise à jour des identifiants administrateur
   */
  @Patch(['credentials', 'admin/credentials'])
  async updateCredentials(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { email?: string; newEmail?: string; password?: string; newPassword?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    if (!token) {
      throw new UnauthorizedException('Token Bearer ou cookie manquant');
    }
    const emailToUpdate = body?.email ?? body?.newEmail;
    const passwordToUpdate = body?.password ?? body?.newPassword;

    return this.authService.updateCredentials(token, emailToUpdate, passwordToUpdate);
  }

  /** Même opération en PUT : certains formulaires existants utilisent ce verbe. */
  @Put(['credentials', 'admin/credentials'])
  async updateCredentialsPut(
    @Req() req: Request,
    @Headers('authorization') authHeader: string,
    @Body() body: { email?: string; newEmail?: string; password?: string; newPassword?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    if (!token) {
      throw new UnauthorizedException('Token Bearer ou cookie manquant');
    }
    const emailToUpdate = body?.email ?? body?.newEmail;
    const passwordToUpdate = body?.password ?? body?.newPassword;

    return this.authService.updateCredentials(token, emailToUpdate, passwordToUpdate);
  }
}
