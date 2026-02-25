import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly users;
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    constructor(users: UsersService, prisma: PrismaService, jwt: JwtService, config: ConfigService);
    register(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            telegramUserId: any;
            membershipType: any;
            membershipExpiresAt: any;
            isAdmin: boolean;
            createdAt: any;
        };
    }>;
    validateUser(email: string, password: string): Promise<{
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
    login(email: string, password: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            telegramUserId: any;
            membershipType: any;
            membershipExpiresAt: any;
            isAdmin: boolean;
            createdAt: any;
        };
    }>;
    issueToken(userId: string, email: string): Promise<{
        accessToken: string;
        user: {
            id: any;
            email: any;
            telegramUserId: any;
            membershipType: any;
            membershipExpiresAt: any;
            isAdmin: boolean;
            createdAt: any;
        };
    }>;
    getProfile(userId: string): Promise<{
        id: any;
        email: any;
        telegramUserId: any;
        membershipType: any;
        membershipExpiresAt: any;
        isAdmin: boolean;
        createdAt: any;
    }>;
    createTelegramLinkToken(userId: string): Promise<string>;
    private buildUserResponse;
}
