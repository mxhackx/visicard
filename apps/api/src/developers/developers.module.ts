import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ApiKeyGuard } from './api-key.guard';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';
import { V1Controller } from './v1.controller';

@Module({
  imports: [AuthModule],
  controllers: [DevelopersController, V1Controller],
  providers: [DevelopersService, ApiKeyGuard],
})
export class DevelopersModule {}
