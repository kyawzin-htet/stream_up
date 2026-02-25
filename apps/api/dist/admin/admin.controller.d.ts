import { PrismaService } from '../prisma/prisma.service';
export declare class AdminController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    status(): Promise<{
        users: number;
        videos: number;
        categories: number;
        linkedUsers: number;
        premiumUsers: number;
        premiumLinked: number;
    }>;
    members(query?: string, membership?: string, page?: string, pageSize?: string): Promise<{
        items: {
            id: string;
            email: string;
            telegramUserId: string | null;
            membershipType: import(".prisma/client").$Enums.MembershipType;
            membershipExpiresAt: Date | null;
            createdAt: Date;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
}
