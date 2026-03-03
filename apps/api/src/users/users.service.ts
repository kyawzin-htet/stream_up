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

  /**
   * Grant admin access to a user. Creates a row in the Admin table if one doesn't
   * already exist. Called on startup for emails listed in ADMIN_EMAILS, and can be
   * called from an admin management endpoint later.
   */
  async grantAdmin(userId: string, grantedByEmail?: string) {
    return this.prisma.admin.upsert({
      where: { userId },
      create: { userId, grantedByEmail: grantedByEmail ?? null },
      update: {},
    });
  }

  /** Revoke admin access by deleting the Admin row. */
  async revokeAdmin(userId: string) {
    return this.prisma.admin.delete({ where: { userId } }).catch(() => null);
  }

  async isAdmin(userId: string): Promise<boolean> {
    const admin = await this.prisma.admin.findUnique({ where: { userId } });
    return !!admin;
  }

  /**
   * Called once on API startup from main.ts.
   * For each email in ADMIN_EMAILS, finds the User and creates an Admin row if not present.
   */
  async seedAdminsFromEmails(emails: string[]) {
    if (!emails.length) return;
    for (const email of emails) {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (user) {
        await this.grantAdmin(user.id, 'system:seed');
      }
    }
  }

  async listPremiumUsers() {
    return this.prisma.user.findMany({
      where: { membershipType: 'PREMIUM' },
    });
  }
}
