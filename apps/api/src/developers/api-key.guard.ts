import { CanActivate, ExecutionContext, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DevelopersService, type ApiKeyContext } from './developers.service';

export type ApiRequest = Request & { apiKey?: ApiKeyContext };

/** Protège `/v1/*` : clé dans `X-API-Key` ou `Authorization: Bearer mck_…`. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly developers: DevelopersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<ApiRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    const header = req.headers['x-api-key'];
    const bearer = req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : '';
    const secret = (Array.isArray(header) ? header[0] : header) || bearer;
    if (!secret) throw new UnauthorizedException('Clé d’API manquante : envoyez l’en-tête X-API-Key.');

    const result = await this.developers.authenticate(secret.trim());
    if (!result.ok) {
      if (result.retryAfter) res.setHeader('Retry-After', String(result.retryAfter));
      throw new HttpException({ statusCode: result.status, error: result.status === 429 ? 'Too Many Requests' : 'Unauthorized', message: result.message }, result.status);
    }
    const { ctx } = result;
    req.apiKey = ctx;
    if (!ctx.admin) {
      res.setHeader('X-RateLimit-Limit-Minute', String(ctx.perMinute));
      res.setHeader('X-Quota-Limit', String(ctx.perMonth));
      res.setHeader('X-Quota-Remaining', String(Math.max(0, ctx.perMonth - ctx.used)));
    } else {
      res.setHeader('X-Quota-Limit', 'unlimited');
    }
    return true;
  }
}
