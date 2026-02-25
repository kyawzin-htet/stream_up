import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { MembershipType } from '@prisma/client';

export class UpdateMembershipDto {
  @IsEnum(MembershipType)
  membershipType!: MembershipType;

  @IsOptional()
  @IsDateString()
  membershipExpiresAt?: string;
}
