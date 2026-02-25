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
var VideosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
let VideosService = VideosService_1 = class VideosService {
    constructor(prisma, telegram) {
        this.prisma = prisma;
        this.telegram = telegram;
        this.logger = new common_1.Logger(VideosService_1.name);
    }
    buildSearchFilter(query) {
        if (!query)
            return undefined;
        const tokens = query
            .split(/\s+/)
            .map((t) => t.trim())
            .filter(Boolean);
        return [
            { title: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            tokens.length ? { keywords: { hasSome: tokens } } : undefined,
        ].filter(Boolean);
    }
    async createVideo(params) {
        const caption = `${params.title}\n\n${params.description}`;
        const [videoResult, gifResult] = await Promise.all([
            this.telegram.sendVideoToChannel(params.file, caption),
            this.telegram.sendAnimationToChannel(params.gifFile, `${params.title}\n\nGIF preview`),
        ]);
        const gifFileId = gifResult?.animation?.file_id || gifResult?.document?.file_id;
        if (!gifFileId) {
            throw new Error('Telegram GIF upload missing file_id');
        }
        try {
            return await this.prisma.video.create({
                data: {
                    title: params.title,
                    description: params.description,
                    categoryId: params.categoryId,
                    keywords: params.keywords,
                    isPremium: params.isPremium,
                    telegramFileId: videoResult.video.file_id,
                    telegramMessageId: String(videoResult.message_id),
                    telegramChannelId: String(videoResult.chat.id),
                    telegramGifFileId: gifFileId,
                    telegramGifMessageId: String(gifResult.message_id),
                    telegramGifChannelId: String(gifResult.chat.id),
                    uploaderId: params.uploaderId,
                },
                include: { category: true },
            });
        }
        catch (error) {
            await Promise.allSettled([
                this.telegram.deleteMessage(String(videoResult.chat.id), String(videoResult.message_id)),
                this.telegram.deleteMessage(String(gifResult.chat.id), String(gifResult.message_id)),
            ]);
            const message = String(error?.message || error);
            this.logger.error(`Failed to save video metadata: ${message}`);
            if (message.includes('telegramGifFileId') ||
                message.includes('telegramGifMessageId') ||
                message.includes('telegramGifChannelId') ||
                message.includes('column') ||
                message.includes('does not exist')) {
                throw new common_1.InternalServerErrorException('Database schema is outdated. Run Prisma migrations, then retry upload.');
            }
            throw new common_1.InternalServerErrorException('Upload succeeded in Telegram but failed to save metadata.');
        }
    }
    async listVideos(params) {
        const where = {
            deletedAt: null,
            telegramGifFileId: { not: null },
        };
        if (params.category) {
            where.category = { slug: params.category };
        }
        if (typeof params.premium === 'boolean') {
            where.isPremium = params.premium;
        }
        if (params.query) {
            where.OR = this.buildSearchFilter(params.query);
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.video.findMany({
                where,
                include: { category: true },
                orderBy: { createdAt: 'desc' },
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize,
            }),
            this.prisma.video.count({ where }),
        ]);
        return {
            items,
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize) || 1,
        };
    }
    async getVideo(id) {
        const video = await this.prisma.video.findFirst({
            where: { id, deletedAt: null },
            include: { category: true },
        });
        if (!video)
            throw new common_1.NotFoundException('Video not found');
        return video;
    }
    async getVideoIncludingDeleted(id) {
        const video = await this.prisma.video.findUnique({
            where: { id },
            include: { category: true },
        });
        if (!video)
            throw new common_1.NotFoundException('Video not found');
        return video;
    }
    async listDeletedVideos(params) {
        const where = {
            deletedAt: { not: null },
            telegramGifFileId: { not: null },
        };
        if (params.query) {
            where.OR = this.buildSearchFilter(params.query);
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.video.findMany({
                where,
                include: { category: true },
                orderBy: { deletedAt: 'desc' },
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize,
            }),
            this.prisma.video.count({ where }),
        ]);
        return {
            items,
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize) || 1,
        };
    }
    async softDeleteVideo(id, deletedById) {
        try {
            return await this.prisma.video.update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    deletedById: deletedById || null,
                },
                include: { category: true },
            });
        }
        catch (error) {
            if (error?.code === 'P2025')
                throw new common_1.NotFoundException('Video not found');
            throw error;
        }
    }
    async restoreVideo(id) {
        try {
            return await this.prisma.video.update({
                where: { id },
                data: { deletedAt: null, deletedById: null },
                include: { category: true },
            });
        }
        catch (error) {
            if (error?.code === 'P2025')
                throw new common_1.NotFoundException('Video not found');
            throw error;
        }
    }
    async deleteVideo(id) {
        try {
            return await this.prisma.video.delete({
                where: { id },
                include: { category: true },
            });
        }
        catch (error) {
            if (error?.code === 'P2025')
                throw new common_1.NotFoundException('Video not found');
            throw error;
        }
    }
};
exports.VideosService = VideosService;
exports.VideosService = VideosService = VideosService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], VideosService);
//# sourceMappingURL=videos.service.js.map