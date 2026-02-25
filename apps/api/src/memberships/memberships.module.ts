import { Module } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { MembershipsController } from './memberships.controller';
import { MembershipUpgradesController } from './membership-upgrades.controller';
import { AdminMembershipUpgradesController } from './admin-membership-upgrades.controller';
import { PricingController } from './pricing.controller';
import { UsersModule } from '../users/users.module';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [UsersModule, TelegramModule],
  providers: [MembershipsService],
  controllers: [
    MembershipsController,
    MembershipUpgradesController,
    AdminMembershipUpgradesController,
    PricingController,
  ],
  exports: [MembershipsService],
})
export class MembershipsModule {}
