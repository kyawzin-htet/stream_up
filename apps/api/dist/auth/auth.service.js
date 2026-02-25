"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcryptjs");
const uuid_1 = require("uuid");
const users_service_1 = require("../users/users.service");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = class AuthService {
    constructor(users, prisma, jwt, config) {
        this.users = users;
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
    }
    async register(email, password) {
        const existing = await this.users.findByEmail(email);
        if (existing)
            throw new common_1.ConflictException('Email already registered');
        const passwordHash = await bcrypt.hash(password, 12);
        let user;
        try {
            user = await this.users.create({ email, passwordHash });
        }
        catch (err) {
            if (err?.code === 'P2002') {
                throw new common_1.ConflictException('Email already registered');
            }
            throw err;
        }
        return this.issueToken(user.id, user.email);
    }
    async validateUser(email, password) {
        const user = await this.users.findByEmail(email);
        if (!user)
            throw new common_1.UnauthorizedException('Invalid credentials');
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok)
            throw new common_1.UnauthorizedException('Invalid credentials');
        return user;
    }
    async login(email, password) {
        const user = await this.validateUser(email, password);
        return this.issueToken(user.id, user.email);
    }
    async issueToken(userId, email) {
        const payload = { sub: userId, email };
        const accessToken = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get('JWT_EXPIRES_IN') || '7d',
        });
        const user = await this.users.findById(userId);
        return { accessToken, user: this.buildUserResponse(user) };
    }
    async getProfile(userId) {
        const user = await this.users.findById(userId);
        return this.buildUserResponse(user);
    }
    async createTelegramLinkToken(userId) {
        const token = (0, uuid_1.v4)().replace(/-/g, '');
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.telegramLinkToken.create({
            data: {
                token,
                userId,
                expiresAt,
            },
        });
        return token;
    }
    buildUserResponse(user) {
        const raw = this.config.get('ADMIN_EMAILS') || '';
        const admins = raw
            .split(',')
            .map((v) => v.trim().toLowerCase())
            .filter(Boolean);
        return {
            id: user.id,
            email: user.email,
            telegramUserId: user.telegramUserId,
            membershipType: user.membershipType,
            membershipExpiresAt: user.membershipExpiresAt,
            isAdmin: admins.includes(String(user.email).toLowerCase()),
            createdAt: user.createdAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map