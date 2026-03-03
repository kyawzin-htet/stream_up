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
exports.CommentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
function sanitizeBody(text) {
    return text.replace(/<[^>]*>/g, '').trim();
}
let CommentsService = class CommentsService {
    constructor(prisma, users) {
        this.prisma = prisma;
        this.users = users;
    }
    async ensureCanComment(userId) {
        const [user, isAdmin] = await Promise.all([
            this.users.findById(userId),
            this.users.isAdmin(userId),
        ]);
        if (isAdmin)
            return;
        const active = user.membershipType === 'PREMIUM' &&
            (!user.membershipExpiresAt || user.membershipExpiresAt.getTime() > Date.now());
        if (!active) {
            throw new common_1.ForbiddenException('Premium membership required to comment');
        }
    }
    async listByVideo(videoId) {
        const video = await this.prisma.video.findFirst({
            where: { id: videoId, deletedAt: null },
            select: { id: true },
        });
        if (!video)
            throw new common_1.NotFoundException('Video not found');
        return this.prisma.comment.findMany({
            where: { videoId, parentId: null },
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, email: true } },
                replies: {
                    orderBy: { createdAt: 'asc' },
                    include: { user: { select: { id: true, email: true } } },
                },
            },
        });
    }
    async createComment(params) {
        if (!params.body.trim())
            throw new common_1.BadRequestException('Comment is empty');
        await this.ensureCanComment(params.userId);
        let videoId = params.videoId;
        let parentId = null;
        if (params.parentId) {
            const parent = await this.prisma.comment.findUnique({
                where: { id: params.parentId },
                select: { id: true, parentId: true, videoId: true },
            });
            if (!parent)
                throw new common_1.NotFoundException('Parent comment not found');
            if (parent.parentId) {
                throw new common_1.BadRequestException('Replies can only be one level deep');
            }
            if (videoId && parent.videoId !== videoId) {
                throw new common_1.BadRequestException('Parent comment does not match video');
            }
            parentId = parent.id;
            videoId = parent.videoId;
        }
        if (!videoId)
            throw new common_1.BadRequestException('Missing video');
        const video = await this.prisma.video.findFirst({
            where: { id: videoId, deletedAt: null },
            select: { id: true },
        });
        if (!video)
            throw new common_1.NotFoundException('Video not found');
        const created = await this.prisma.comment.create({
            data: {
                videoId,
                userId: params.userId,
                body: sanitizeBody(params.body),
                parentId,
            },
            include: {
                user: { select: { id: true, email: true } },
            },
        });
        return created;
    }
};
exports.CommentsService = CommentsService;
exports.CommentsService = CommentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        users_service_1.UsersService])
], CommentsService);
//# sourceMappingURL=comments.service.js.map