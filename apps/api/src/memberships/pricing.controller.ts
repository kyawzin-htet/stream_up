import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { MembershipsService } from './memberships.service';
import { Public } from '../common/public.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';

@Controller('pricing')
export class PricingController {
  constructor(private readonly memberships: MembershipsService) {}

  @Public()
  @Get('plans')
  async listPlans() {
    const [settings, plans] = await Promise.all([
      this.memberships.getPricingSettings(),
      this.memberships.listPlans(),
    ]);

    return {
      currency: settings?.currency || 'USD',
      plans: plans.filter((plan) => plan.active),
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('plans/all')
  async listAllPlans() {
    const [settings, plans] = await Promise.all([
      this.memberships.getPricingSettings(),
      this.memberships.listPlans(),
    ]);

    return {
      currency: settings?.currency || 'USD',
      plans,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('settings')
  async updateSettings(@Body() body: { currency?: string }) {
    if (!body.currency) return this.memberships.getPricingSettings();
    return this.memberships.updatePricingSettings(body.currency);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Put('plans/:id')
  async updatePlan(
    @Param('id') id: string,
    @Body() body: { amount?: number; active?: boolean; name?: string },
  ) {
    return this.memberships.updatePlan(id, body);
  }
}
