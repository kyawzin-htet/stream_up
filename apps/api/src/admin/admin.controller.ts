import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Controller('admin')
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('status')
  async status() {
    const [userCount, videoCount, categoryCount, linkedUsers, premiumUsers, premiumLinked] =
      await Promise.all([
      this.prisma.user.count(),
      this.prisma.video.count(),
      this.prisma.category.count(),
      this.prisma.user.count({ where: { telegramUserId: { not: null } } }),
      this.prisma.user.count({ where: { membershipType: 'PREMIUM' } }),
      this.prisma.user.count({
        where: { membershipType: 'PREMIUM', telegramUserId: { not: null } },
      }),
    ]);

    return {
      users: userCount,
      videos: videoCount,
      categories: categoryCount,
      linkedUsers,
      premiumUsers,
      premiumLinked,
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('members')
  async members(
    @Query('query') query?: string,
    @Query('membership') membership?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const where: Prisma.UserWhereInput = {};

    if (membership === 'FREE' || membership === 'PREMIUM') {
      where.membershipType = membership;
    }

    if (query) {
      const q = query.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { telegramUserId: { contains: q, mode: 'insensitive' } },
      ];
    }

    const pageNumber = Math.max(1, Number(page) || 1);
    const pageLimit = Math.min(50, Math.max(1, Number(pageSize) || 20));

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNumber - 1) * pageLimit,
        take: pageLimit,
      }),
      this.prisma.user.count({ where }),
    ]);

    const sanitized = items.map((user) => ({
      id: user.id,
      email: user.email,
      telegramUserId: user.telegramUserId,
      membershipType: user.membershipType,
      membershipExpiresAt: user.membershipExpiresAt,
      createdAt: user.createdAt,
    }));

    return {
      items: sanitized,
      total,
      page: pageNumber,
      pageSize: pageLimit,
      totalPages: Math.ceil(total / pageLimit) || 1,
    };
  }
}
