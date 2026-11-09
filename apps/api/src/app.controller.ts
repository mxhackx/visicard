import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';

/** Route de santé : Render l'appelle en continu, elle ne doit jamais être limitée (sinon l'API est jugée en panne et redémarrée). */
@Controller()
@SkipThrottle({ short: true, default: true })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
