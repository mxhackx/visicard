import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { OrdersController, PaymentsWebhookController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminStatsController } from './stats.controller';
import { FeexpayService } from './payments/feexpay.service';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';

@Module({
  imports: [PrismaModule, AuthModule, CardsModule],
  controllers: [OrdersController, PaymentsWebhookController, AdminStatsController, PremiumController],
  providers: [OrdersService, FeexpayService, PremiumService],
})
export class OrdersModule {}
