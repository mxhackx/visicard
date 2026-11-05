import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AdminStatsController } from './stats.controller';

@Module({
  imports: [PrismaModule, AuthModule, CardsModule],
  controllers: [OrdersController, AdminStatsController],
  providers: [OrdersService],
})
export class OrdersModule {}
