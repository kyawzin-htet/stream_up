import { MembershipType } from '@prisma/client';
export declare class UpdateMembershipDto {
    membershipType: MembershipType;
    membershipExpiresAt?: string;
}
