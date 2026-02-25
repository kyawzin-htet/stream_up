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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../common/admin.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminController = class AdminController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async status() {
        const [userCount, videoCount, categoryCount, linkedUsers, premiumUsers, premiumLinked] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.video.count(),
            this.prisma.category.count(),
            this.prisma.user.count({ where: { telegramUserId: { not: null } } }),
            this.prisma.user.count({ where: { membershipType: 'PREMIUM' } }),
            this.prisma.user.count({
                where: { membershipType: 'PREMIUM', telegramUserId: { not: null } },
            }),
        ]);
        return {
            users: userCount,
            videos: videoCount,
            categories: categoryCount,
            linkedUsers,
            premiumUsers,
            premiumLinked,
        };
    }
    async members(query, membership, page = '1', pageSize = '20') {
        const where = {};
        if (membership === 'FREE' || membership === 'PREMIUM') {
            where.membershipType = membership;
        }
        if (query) {
            const q = query.trim();
            where.OR = [
                { email: { contains: q, mode: 'insensitive' } },
                { telegramUserId: { contains: q, mode: 'insensitive' } },
            ];
        }
        const pageNumber = Math.max(1, Number(page) || 1);
        const pageLimit = Math.min(50, Math.max(1, Number(pageSize) || 20));
        const [items, total] = await this.prisma.$transaction([
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (pageNumber - 1) * pageLimit,
                take: pageLimit,
            }),
            this.prisma.user.count({ where }),
        ]);
        const sanitized = items.map((user) => ({
            id: user.id,
            email: user.email,
            telegramUserId: user.telegramUserId,
            membershipType: user.membershipType,
            membershipExpiresAt: user.membershipExpiresAt,
            createdAt: user.createdAt,
        }));
        return {
            items: sanitized,
            total,
            page: pageNumber,
            pageSize: pageLimit,
            totalPages: Math.ceil(total / pageLimit) || 1,
        };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "status", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('members'),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('membership')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "members", null);
exports.AdminController = AdminController = __decorate([
    (0, common_1.Controller)('admin'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map