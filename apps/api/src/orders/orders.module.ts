import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { OrdersController, PaymentsWebhookController } from './orders.controller';
import { OrdersService } from './orders.service';
import { FedapayService } from './payments/fedapay.service';
import { MomoService } from './payments/momo.service';

@Module({
  imports: [PrismaModule, AuthModule, CardsModule],
  controllers: [OrdersController, PaymentsWebhookController],
  providers: [OrdersService, FedapayService, MomoService],
})
export class OrdersModule {}
