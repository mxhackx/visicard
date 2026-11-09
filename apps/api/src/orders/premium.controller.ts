import { Controller, Get, Headers, HttpCode, Post, Req, UnauthorizedException } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { PremiumService } from './premium.service';

@Controller('premium')
export class PremiumController {
  constructor(
    private readonly premium: PremiumService,
    private readonly auth: AuthService,
  ) {}

  private async user(req: Request, authHeader?: string) {
    let token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) token = (req as Request & { cookies?: Record<string, string> }).cookies?.['access_token'] ?? null;
    const result = token ? await this.auth.validateToken(token) : { valid: false as const };
    if (!result.valid || !result.user) throw new UnauthorizedException('Connexion requise.');
    return result.user;
  }

  @Get('status')
  @SkipThrottle({ short: true })
  async status(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    return this.premium.status(await this.user(req, authHeader));
  }

  @Post('checkout')
  @HttpCode(200)
  @Throttle({ short: { limit: 5, ttl: 60_000 } })
  async checkout(@Req() req: Request, @Headers('authorization') authHeader?: string) {
    return this.premium.checkout(await this.user(req, authHeader));
  }
}
