import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
export declare class AuthController {
    private readonly auth;
    private readonly config;
    constructor(auth: AuthService, config: ConfigService);
    register(dto: RegisterDto): Promise<{
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
    login(dto: LoginDto): Promise<{
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
    me(user: {
        id: string;
    }): Promise<{
        id: any;
        email: any;
        telegramUserId: any;
        membershipType: any;
        membershipExpiresAt: any;
        isAdmin: boolean;
        createdAt: any;
    }>;
    createTelegramLink(user: {
        id: string;
    }): Promise<{
        token: string;
        deepLink: string | null;
    }>;
}
