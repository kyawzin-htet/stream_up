import { MembershipsService } from './memberships.service';
export declare class PricingController {
    private readonly memberships;
    constructor(memberships: MembershipsService);
    listPlans(): Promise<{
        currency: string;
        plans: {
            id: string;
            createdAt: Date;
            name: string;
            active: boolean;
            updatedAt: Date;
            code: string;
            durationMonths: number | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
        }[];
    }>;
    listAllPlans(): Promise<{
        currency: string;
        plans: {
            id: string;
            createdAt: Date;
            name: string;
            active: boolean;
            updatedAt: Date;
            code: string;
            durationMonths: number | null;
            amount: import("@prisma/client-runtime-utils").Decimal;
        }[];
    }>;
    updateSettings(body: {
        currency?: string;
    }): Promise<{
        id: number;
        currency: string;
        updatedAt: Date;
    } | null>;
    updatePlan(id: string, body: {
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
        amount: import("@prisma/client-runtime-utils").Decimal;
    }>;
}
