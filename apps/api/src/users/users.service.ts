import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MembershipType, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateTelegramUserId(userId: string, telegramUserId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { telegramUserId },
    });
  }

  async setMembership(userId: string, membershipType: MembershipType, expiresAt: Date | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        membershipType,
        membershipExpiresAt: expiresAt,
        membershipExpiryNoticeAt: null,
        membershipExpiredNoticeAt: null,
      },
    });
  }

  async listPremiumUsers() {
    return this.prisma.user.findMany({
      where: { membershipType: 'PREMIUM' },
    });
  }
}
