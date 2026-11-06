import { Body, Controller, Delete, Get, Headers, Param, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { DevelopersService } from './developers.service';

/** Gestion des clés par leur propriétaire connecté (compte client ou administrateur). */
@Controller('developers')
export class DevelopersController {
  constructor(
    private readonly developers: DevelopersService,
    private readonly auth: AuthService,
  ) {}

  private async session(req: Request, authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    const result = token ? await this.auth.validateToken(token) : null;
    if (!result?.valid || !result.user) throw new UnauthorizedException('Connectez-vous pour gérer vos clés d’API.');
    return { id: result.user.id, admin: result.user.role === 'admin' };
  }

  @Get('keys')
  async list(@Req() req: Request, @Headers('authorization') h?: string) {
    const s = await this.session(req, h);
    return this.developers.listKeys(s.id, s.admin);
  }

  @Post('keys')
  async create(@Req() req: Request, @Headers('authorization') h: string | undefined, @Body() body: { name?: string }) {
    const s = await this.session(req, h);
    return this.developers.createKey(s.id, s.admin, body?.name ?? '');
  }

  @Delete('keys/:id')
  async revoke(@Req() req: Request, @Headers('authorization') h: string | undefined, @Param('id') id: string) {
    const s = await this.session(req, h);
    return this.developers.revokeKey(s.id, id);
  }
}
