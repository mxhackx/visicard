import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CardsModule } from '../cards/cards.module';
import { AccountController, PublicRequestsController } from './account.controller';
import { AccountService } from './account.service';

@Module({
  imports: [AuthModule, CardsModule],
  controllers: [AccountController, PublicRequestsController],
  providers: [AccountService],
})
export class AccountModule {}
