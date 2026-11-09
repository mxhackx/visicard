import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { OrdersController, PaymentsWebhookController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminStatsController } from './stats.controller';
import { FedapayService } from './payments/fedapay.service';
import { PremiumService } from './premium.service';
import { PremiumController } from './premium.controller';

@Module({
  imports: [PrismaModule, AuthModule, CardsModule],
  controllers: [OrdersController, PaymentsWebhookController, AdminStatsController, PremiumController],
  providers: [OrdersService, FedapayService, PremiumService],
})
export class OrdersModule {}
