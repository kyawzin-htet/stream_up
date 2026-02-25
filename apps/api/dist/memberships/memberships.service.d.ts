import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../telegram/telegram.service';
import { MembershipType, MembershipUpgradeStatus, Prisma } from '@prisma/client';
export declare class MembershipsService {
    private readonly prisma;
    private readonly users;
    private readonly telegram;
    private readonly logger;
    constructor(prisma: PrismaService, users: UsersService, telegram: TelegramService);
    private ensureDefaults;
    updateMembership(userId: string, type: MembershipType, expiresAt: Date | null): Promise<{
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
    getPricingSettings(): Promise<{
        id: number;
        currency: string;
        updatedAt: Date;
    } | null>;
    updatePricingSettings(currency: string): Promise<{
        id: number;
        currency: string;
        updatedAt: Date;
    }>;
    listPlans(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        active: boolean;
        updatedAt: Date;
        code: string;
        durationMonths: number | null;
        amount: Prisma.Decimal;
    }[]>;
    updatePlan(planId: string, data: {
        amount?: number;
        active?: boolean;
        name?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        active: boolean;
        updatedAt: Date;
        code: string;
        durationMonths: number | null;
        amount: Prisma.Decimal;
    }>;
    createUpgradeRequest(params: {
        userId: string;
        planId: string;
        note?: string | null;
        file: Express.Multer.File;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: Prisma.Decimal;
        currencySnapshot: string;
        planNameSnapshot: string;
        durationMonthsSnapshot: number | null;
        paymentSlipFileId: string;
        paymentSlipMessageId: string;
        paymentSlipChannelId: string;
        reviewedAt: Date | null;
        planId: string;
        reviewedById: string | null;
    }>;
    listUpgradeRequestsForUser(userId: string): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            active: boolean;
            updatedAt: Date;
            code: string;
            durationMonths: number | null;
            amount: Prisma.Decimal;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: Prisma.Decimal;
        currencySnapshot: string;
        planNameSnapshot: string;
        durationMonthsSnapshot: number | null;
        paymentSlipFileId: string;
        paymentSlipMessageId: string;
        paymentSlipChannelId: string;
        reviewedAt: Date | null;
        planId: string;
        reviewedById: string | null;
    })[]>;
    listUpgradeRequestsAdmin(params: {
        status?: MembershipUpgradeStatus;
        page: number;
        pageSize: number;
    }): Promise<{
        items: ({
            user: {
                id: string;
                email: string;
                telegramUserId: string | null;
                membershipType: import(".prisma/client").$Enums.MembershipType;
                membershipExpiresAt: Date | null;
                createdAt: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
            note: string | null;
            amountSnapshot: Prisma.Decimal;
            currencySnapshot: string;
            planNameSnapshot: string;
            durationMonthsSnapshot: number | null;
            paymentSlipFileId: string;
            paymentSlipMessageId: string;
            paymentSlipChannelId: string;
            reviewedAt: Date | null;
            planId: string;
            reviewedById: string | null;
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getUpgradeRequest(id: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: Prisma.Decimal;
        currencySnapshot: string;
        planNameSnapshot: string;
        durationMonthsSnapshot: number | null;
        paymentSlipFileId: string;
        paymentSlipMessageId: string;
        paymentSlipChannelId: string;
        reviewedAt: Date | null;
        planId: string;
        reviewedById: string | null;
    }>;
    approveUpgradeRequest(id: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: Prisma.Decimal;
        currencySnapshot: string;
        planNameSnapshot: string;
        durationMonthsSnapshot: number | null;
        paymentSlipFileId: string;
        paymentSlipMessageId: string;
        paymentSlipChannelId: string;
        reviewedAt: Date | null;
        planId: string;
        reviewedById: string | null;
    }>;
    rejectUpgradeRequest(id: string, adminId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: Prisma.Decimal;
        currencySnapshot: string;
        planNameSnapshot: string;
        durationMonthsSnapshot: number | null;
        paymentSlipFileId: string;
        paymentSlipMessageId: string;
        paymentSlipChannelId: string;
        reviewedAt: Date | null;
        planId: string;
        reviewedById: string | null;
    }>;
    upgradeSummary(): Promise<{
        planId: string;
        planName: string;
        currency: string;
        durationMonths: number | null;
        totalAmount: Prisma.Decimal;
        count: number;
    }[]>;
    syncAll(): Promise<{
        ok: boolean;
        processed: number;
    }>;
    enforceExpirations(): Promise<void>;
}
