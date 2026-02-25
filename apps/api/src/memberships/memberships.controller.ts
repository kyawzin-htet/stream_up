import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('admin/memberships')
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':userId')
  async update(@Param('userId') userId: string, @Body() dto: UpdateMembershipDto) {
    const expiresAt = dto.membershipExpiresAt ? new Date(dto.membershipExpiresAt) : null;
    return this.memberships.updateMembership(userId, dto.membershipType, expiresAt);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('sync')
  async syncAll() {
    return this.memberships.syncAll();
  }
}
