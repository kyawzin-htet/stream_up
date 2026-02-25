import { MembershipsService } from './memberships.service';
export declare class MembershipUpgradesController {
    private readonly memberships;
    constructor(memberships: MembershipsService);
    create(file: Express.Multer.File, planId: string, note: string | undefined, user: {
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
    listMine(user: {
        id: string;
    }): Promise<({
        plan: {
            id: string;
            createdAt: Date;
            name: string;
            active: boolean;
            updatedAt: Date;
            code: string;
            durationMonths: number | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
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
    })[]>;
}
