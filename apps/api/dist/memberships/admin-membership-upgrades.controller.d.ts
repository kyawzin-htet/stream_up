import { Response } from 'express';
import { MembershipsService } from './memberships.service';
import { TelegramService } from '../telegram/telegram.service';
import { MembershipUpgradeStatus } from '@prisma/client';
export declare class AdminMembershipUpgradesController {
    private readonly memberships;
    private readonly telegram;
    private readonly logger;
    constructor(memberships: MembershipsService, telegram: TelegramService);
    list(status?: MembershipUpgradeStatus, page?: string, pageSize?: string): Promise<{
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
            amountSnapshot: import("@prisma/client-runtime-utils").Decimal;
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
    summary(): Promise<{
        planId: string;
        planName: string;
        currency: string;
        durationMonths: number | null;
        totalAmount: import("@prisma/client-runtime-utils").Decimal;
        count: number;
    }[]>;
    approve(id: string, user: {
        id: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: import("@prisma/client-runtime-utils").Decimal;
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
    reject(id: string, user: {
        id: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.MembershipUpgradeStatus;
        note: string | null;
        amountSnapshot: import("@prisma/client-runtime-utils").Decimal;
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
    slip(id: string, res: Response): Promise<void>;
}
