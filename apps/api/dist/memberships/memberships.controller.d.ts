import { MembershipsService } from './memberships.service';
import { UpdateMembershipDto } from './dto/update-membership.dto';
export declare class MembershipsController {
    private readonly memberships;
    constructor(memberships: MembershipsService);
    update(userId: string, dto: UpdateMembershipDto): Promise<{
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
    syncAll(): Promise<{
        ok: boolean;
        processed: number;
    }>;
}
