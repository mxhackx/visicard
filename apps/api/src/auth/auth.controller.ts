import {
  Req,
  Res,
  Controller,
  Post,
  Get,
  Patch,
  Put,
  Param,
  Body,
  Headers,
  UnauthorizedException,
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

    return {
      authenticated: true,
      user,
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

  /** Nomme un client administrateur, ou lui retire ce rôle. */
  @Patch('accounts/:id/role')
  async setAccountRole(
    @Req() req: Request,
    @Headers('authorization') authHeader: string | undefined,
    @Param('id') id: string,
    @Body() body: { role?: string },
  ) {
    const token = this.sessionToken(req, authHeader);
    if (!token || !(await this.authService.validateAdminToken(token))) {
      throw new UnauthorizedException('Accès réservé aux administrateurs.');
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
