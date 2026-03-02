import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../telegram/telegram.service';
import { MembershipType, MembershipUpgradeStatus, Prisma } from '@prisma/client';

@Injectable()
export class MembershipsService {
  private readonly logger = new Logger(MembershipsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly telegram: TelegramService,
  ) {}

  private async ensureDefaults() {
    await this.prisma.pricingSettings.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, currency: 'USD' },
    });

    await this.prisma.pricingPlan.createMany({
      data: [
        { code: '1m', name: '1 Month', durationMonths: 1, amount: new Prisma.Decimal(0) },
        { code: '2m', name: '2 Months', durationMonths: 2, amount: new Prisma.Decimal(0) },
        { code: '3m', name: '3 Months', durationMonths: 3, amount: new Prisma.Decimal(0) },
        { code: 'lifetime', name: 'Lifetime', durationMonths: null, amount: new Prisma.Decimal(0) },
      ],
      skipDuplicates: true,
    });
  }

  async updateMembership(userId: string, type: MembershipType, expiresAt: Date | null) {
    const user = await this.users.setMembership(userId, type, expiresAt);

    if (user.telegramUserId) {
      if (type === 'PREMIUM' && (!expiresAt || expiresAt.getTime() > Date.now())) {
        await this.telegram.sendPremiumInvite(user.telegramUserId);
      } else {
        await this.telegram.removeUserFromGroup(user.telegramUserId);
      }
    }

    return user;
  }

  async getPricingSettings() {
    await this.ensureDefaults();
    return this.prisma.pricingSettings.findUnique({ where: { id: 1 } });
  }

  async updatePricingSettings(currency: string) {
    await this.ensureDefaults();
    return this.prisma.pricingSettings.update({
      where: { id: 1 },
      data: { currency },
    });
  }

  async listPlans() {
    await this.ensureDefaults();
    const plans = await this.prisma.pricingPlan.findMany({
      orderBy: { createdAt: 'asc' },
    });

    const unique = new Map<string, (typeof plans)[number]>();
    for (const plan of [...plans].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())) {
      const key = plan.code || `${plan.name}-${plan.durationMonths ?? 'lifetime'}`;
      if (!unique.has(key)) unique.set(key, plan);
    }

    const order = ['1m', '2m', '3m', 'lifetime'];
    return Array.from(unique.values()).sort((a, b) => {
      const aIndex = a.code ? order.indexOf(a.code) : order.length;
      const bIndex = b.code ? order.indexOf(b.code) : order.length;
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  async updatePlan(planId: string, data: { amount?: number; active?: boolean; name?: string }) {
    await this.ensureDefaults();
    return this.prisma.pricingPlan.update({
      where: { id: planId },
      data: {
        amount: data.amount !== undefined ? new Prisma.Decimal(data.amount) : undefined,
        active: data.active,
        name: data.name,
      },
    });
  }

  async createUpgradeRequest(params: {
    userId: string;
    planId: string;
    note?: string | null;
    file: Express.Multer.File;
  }) {
    await this.ensureDefaults();

    const existing = await this.prisma.membershipUpgradeRequest.findFirst({
      where: { userId: params.userId, status: 'PENDING' },
    });
    if (existing) throw new ConflictException('Pending request already exists');

    const plan = await this.prisma.pricingPlan.findUnique({ where: { id: params.planId } });
    if (!plan || !plan.active) throw new NotFoundException('Plan not found');

    const settings = await this.prisma.pricingSettings.findUnique({ where: { id: 1 } });
    const currency = settings?.currency || 'USD';

    const caption = `Payment slip\\nPlan: ${plan.name}\\nUser: ${params.userId}`;
    const result = await this.telegram.sendPhotoToChannel(params.file, caption);

    const photo = Array.isArray(result.photo) ? result.photo[result.photo.length - 1] : null;
    const fileId = photo?.file_id || result.document?.file_id || result.photo?.file_id;
    if (!fileId) throw new Error('Telegram upload failed');

    return this.prisma.membershipUpgradeRequest.create({
      data: {
        userId: params.userId,
        planId: plan.id,
        status: 'PENDING',
        note: params.note || null,
        amountSnapshot: plan.amount,
        currencySnapshot: currency,
        planNameSnapshot: plan.name,
        durationMonthsSnapshot: plan.durationMonths,
        paymentSlipFileId: fileId,
        paymentSlipMessageId: String(result.message_id),
        paymentSlipChannelId: String(result.chat.id),
      },
    });
  }

  async listUpgradeRequestsForUser(userId: string) {
    return this.prisma.membershipUpgradeRequest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });
  }

  async listUpgradeRequestsAdmin(params: {
    status?: MembershipUpgradeStatus;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.MembershipUpgradeRequestWhereInput = {};
    if (params.status) where.status = params.status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.membershipUpgradeRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              telegramUserId: true,
              membershipType: true,
              membershipExpiresAt: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.membershipUpgradeRequest.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async getUpgradeRequest(id: string) {
    const request = await this.prisma.membershipUpgradeRequest.findUnique({
      where: { id },
    });
    if (!request) throw new NotFoundException('Request not found');
    return request;
  }

  async approveUpgradeRequest(id: string, adminId: string) {
    const request = await this.getUpgradeRequest(id);
    if (request.status !== 'PENDING') return request;

    const user = await this.users.findById(request.userId);
    let expiresAt: Date | null = null;
    if (request.durationMonthsSnapshot) {
      const base =
        user.membershipExpiresAt && user.membershipExpiresAt.getTime() > Date.now()
          ? user.membershipExpiresAt
          : new Date();
      expiresAt = new Date(base);
      expiresAt.setMonth(expiresAt.getMonth() + request.durationMonthsSnapshot);
    }

    await this.updateMembership(user.id, 'PREMIUM', expiresAt);

    return this.prisma.membershipUpgradeRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async rejectUpgradeRequest(id: string, adminId: string) {
    const request = await this.getUpgradeRequest(id);
    if (request.status === 'REJECTED') return request;

    if (request.status === 'APPROVED') {
      await this.updateMembership(request.userId, 'FREE', null);
    }

    return this.prisma.membershipUpgradeRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
  }

  async upgradeSummary() {
    const rows = await this.prisma.membershipUpgradeRequest.groupBy({
      by: ['planId', 'planNameSnapshot', 'currencySnapshot', 'durationMonthsSnapshot'],
      where: { status: 'APPROVED' },
      _sum: { amountSnapshot: true },
      _count: { _all: true },
    });

    return rows.map((row) => ({
      planId: row.planId,
      planName: row.planNameSnapshot,
      currency: row.currencySnapshot,
      durationMonths: row.durationMonthsSnapshot,
      totalAmount: row._sum.amountSnapshot || new Prisma.Decimal(0),
      count: row._count._all,
    }));
  }

  async syncAll() {
    const premiumUsers = await this.users.listPremiumUsers();
    const now = Date.now();

    for (const user of premiumUsers) {
      const expired = user.membershipExpiresAt && user.membershipExpiresAt.getTime() <= now;
      if (expired) {
        await this.users.setMembership(user.id, 'FREE', null);
        if (user.telegramUserId) {
          await this.telegram.removeUserFromGroup(user.telegramUserId);
        }
        continue;
      }

      if (user.telegramUserId) {
        await this.telegram.sendPremiumInvite(user.telegramUserId);
      }
    }

    return { ok: true, processed: premiumUsers.length };
  }

  // Runs hourly to enforce expirations and remove group access.
  @Cron('0 * * * *')
  async enforceExpirations() {
    const now = new Date();
    const soon = new Date(now);
    soon.setDate(soon.getDate() + 3);

    const expiringSoon = await this.prisma.user.findMany({
      where: {
        membershipType: 'PREMIUM',
        membershipExpiresAt: { gt: now, lte: soon },
        membershipExpiryNoticeAt: null,
      },
    });

    for (const user of expiringSoon) {
      try {
        if (user.telegramUserId) {
          await this.telegram.sendMessage(
            user.telegramUserId,
            `Your premium plan expires on ${user.membershipExpiresAt?.toLocaleDateString()}. Please renew to keep access.`,
          );
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data: { membershipExpiryNoticeAt: new Date() },
        });
      } catch (error) {
        this.logger.error(`Failed to notify expiring user ${user.id}: ${String(error)}`);
      }
    }

    const expiring = await this.prisma.user.findMany({
      where: {
        membershipType: 'PREMIUM',
        membershipExpiresAt: { lte: now },
      },
    });

    for (const user of expiring) {
      try {
        if (user.telegramUserId && !user.membershipExpiredNoticeAt) {
          await this.telegram.sendMessage(
            user.telegramUserId,
            'Your premium plan has expired. Upgrade again to regain access.',
          );
        }
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            membershipType: 'FREE',
            membershipExpiresAt: null,
            membershipExpiredNoticeAt: new Date(),
          },
        });
        if (user.telegramUserId) {
          await this.telegram.removeUserFromGroup(user.telegramUserId);
        }
      } catch (error) {
        this.logger.error(`Failed to expire user ${user.id}: ${String(error)}`);
      }
    }
  }
}
