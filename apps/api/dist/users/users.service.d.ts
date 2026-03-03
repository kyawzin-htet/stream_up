import { PrismaService } from '../prisma/prisma.service';
import { MembershipType, Prisma } from '@prisma/client';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(data: Prisma.UserCreateInput): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    }>;
    updateTelegramUserId(userId: string, telegramUserId: string): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    }>;
    setMembership(userId: string, membershipType: MembershipType, expiresAt: Date | null): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    }>;
    grantAdmin(userId: string, grantedByEmail?: string): Promise<{
        id: string;
        userId: string;
        grantedAt: Date;
        grantedByEmail: string | null;
    }>;
    revokeAdmin(userId: string): Promise<{
        id: string;
        userId: string;
        grantedAt: Date;
        grantedByEmail: string | null;
    } | null>;
    isAdmin(userId: string): Promise<boolean>;
    seedAdminsFromEmails(emails: string[]): Promise<void>;
    listPremiumUsers(): Promise<{
        id: string;
        email: string;
        passwordHash: string;
        telegramUserId: string | null;
        membershipType: import(".prisma/client").$Enums.MembershipType;
        membershipExpiresAt: Date | null;
        membershipExpiryNoticeAt: Date | null;
        membershipExpiredNoticeAt: Date | null;
        createdAt: Date;
    }[]>;
}
