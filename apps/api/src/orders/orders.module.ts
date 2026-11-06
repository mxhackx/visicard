import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { OrdersController, PaymentsWebhookController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminStatsController } from './stats.controller';
import { FedapayService } from './payments/fedapay.service';

@Module({
  imports: [PrismaModule, AuthModule, CardsModule],
  controllers: [OrdersController, PaymentsWebhookController, AdminStatsController],
  providers: [OrdersService, FedapayService],
})
export class OrdersModule {}
