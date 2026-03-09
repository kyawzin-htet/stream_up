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
        const uploadGif = async () => {
            try {
                return await this.telegram.sendAnimationToChannel(params.gifFile, `${params.title}\n\nGIF preview`);
            }
            catch (error) {
                this.logger.warn(`sendAnimation failed, falling back to sendDocument: ${String(error)}`);
                return this.telegram.sendDocumentToChannel(params.gifFile, `${params.title}\n\nGIF preview`);
            }
        };
        const [videoResult, gifResult] = await Promise.all([
            this.telegram.sendVideoToChannel(params.file, caption),
            uploadGif(),
        ]);
        const gifFileId = gifResult?.document?.file_id || gifResult?.animation?.file_id;
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
        const orderBy = params.sort === 'popular'
            ? [{ likes: { _count: 'desc' } }, { createdAt: 'desc' }]
            : [{ createdAt: 'desc' }];
        const [items, total] = await this.prisma.$transaction([
            this.prisma.video.findMany({
                where,
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
                orderBy,
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
        try {
            const video = await this.prisma.video.findFirst({
                where: { id, deletedAt: null },
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
            });
            if (!video)
                throw new common_1.NotFoundException('Video not found');
            return video;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.warn(`Primary getVideo query failed for ${id}: ${String(error)}`);
            const base = await this.prisma.video.findFirst({
                where: { id, deletedAt: null },
            });
            if (!base)
                throw new common_1.NotFoundException('Video not found');
            const [category, likeCount, favoriteCount] = await Promise.all([
                this.prisma.category.findUnique({ where: { id: base.categoryId } }),
                this.prisma.videoLike.count({ where: { videoId: base.id } }),
                this.prisma.videoFavorite.count({ where: { videoId: base.id } }),
            ]);
            return {
                ...base,
                category: category || {
                    id: base.categoryId,
                    name: 'Unknown',
                    slug: 'unknown',
                    createdAt: base.createdAt,
                },
                _count: { likes: likeCount, favorites: favoriteCount },
            };
        }
    }
    async getVideoIncludingDeleted(id) {
        try {
            const video = await this.prisma.video.findUnique({
                where: { id },
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
            });
            if (!video)
                throw new common_1.NotFoundException('Video not found');
            return video;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            this.logger.warn(`Primary getVideoIncludingDeleted query failed for ${id}: ${String(error)}`);
            const base = await this.prisma.video.findUnique({ where: { id } });
            if (!base)
                throw new common_1.NotFoundException('Video not found');
            const [category, likeCount, favoriteCount] = await Promise.all([
                this.prisma.category.findUnique({ where: { id: base.categoryId } }),
                this.prisma.videoLike.count({ where: { videoId: base.id } }),
                this.prisma.videoFavorite.count({ where: { videoId: base.id } }),
            ]);
            return {
                ...base,
                category: category || {
                    id: base.categoryId,
                    name: 'Unknown',
                    slug: 'unknown',
                    createdAt: base.createdAt,
                },
                _count: { likes: likeCount, favorites: favoriteCount },
            };
        }
    }
    async listDeletedVideos(params) {
        const where = {
            deletedAt: { not: null },
        };
        if (params.query) {
            where.OR = this.buildSearchFilter(params.query);
        }
        const [items, total] = await this.prisma.$transaction([
            this.prisma.video.findMany({
                where,
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
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
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
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
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
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
                include: { category: true, _count: { select: { likes: true, favorites: true } } },
            });
        }
        catch (error) {
            if (error?.code === 'P2025')
                throw new common_1.NotFoundException('Video not found');
            throw error;
        }
    }
    async getLikedVideoIds(userId, videoIds) {
        if (!videoIds.length)
            return [];
        const rows = await this.prisma.videoLike.findMany({
            where: {
                userId,
                videoId: { in: videoIds },
            },
            select: { videoId: true },
        });
        return rows.map((row) => row.videoId);
    }
    async getFavoritedVideoIds(userId, videoIds) {
        if (!videoIds.length)
            return [];
        const rows = await this.prisma.videoFavorite.findMany({
            where: {
                userId,
                videoId: { in: videoIds },
            },
            select: { videoId: true },
        });
        return rows.map((row) => row.videoId);
    }
    async isVideoLikedByUser(videoId, userId) {
        const row = await this.prisma.videoLike.findUnique({
            where: {
                userId_videoId: {
                    userId,
                    videoId,
                },
            },
            select: { id: true },
        });
        return Boolean(row);
    }
    async isVideoFavoritedByUser(videoId, userId) {
        const row = await this.prisma.videoFavorite.findUnique({
            where: {
                userId_videoId: {
                    userId,
                    videoId,
                },
            },
            select: { id: true },
        });
        return Boolean(row);
    }
    async toggleLike(videoId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const video = await tx.video.findFirst({
                where: { id: videoId, deletedAt: null },
                select: { id: true },
            });
            if (!video)
                throw new common_1.NotFoundException('Video not found');
            const existing = await tx.videoLike.findUnique({
                where: {
                    userId_videoId: {
                        userId,
                        videoId,
                    },
                },
                select: { id: true },
            });
            if (existing) {
                await tx.videoLike.delete({
                    where: {
                        userId_videoId: {
                            userId,
                            videoId,
                        },
                    },
                });
            }
            else {
                await tx.videoLike.create({
                    data: {
                        userId,
                        videoId,
                    },
                });
            }
            const likeCount = await tx.videoLike.count({
                where: { videoId },
            });
            return {
                liked: !existing,
                likeCount,
            };
        });
    }
    async toggleFavorite(videoId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const video = await tx.video.findFirst({
                where: { id: videoId, deletedAt: null },
                select: { id: true },
            });
            if (!video)
                throw new common_1.NotFoundException('Video not found');
            const existing = await tx.videoFavorite.findUnique({
                where: {
                    userId_videoId: {
                        userId,
                        videoId,
                    },
                },
                select: { id: true },
            });
            if (existing) {
                await tx.videoFavorite.delete({
                    where: {
                        userId_videoId: {
                            userId,
                            videoId,
                        },
                    },
                });
            }
            else {
                await tx.videoFavorite.create({
                    data: {
                        userId,
                        videoId,
                    },
                });
            }
            const favoriteCount = await tx.videoFavorite.count({
                where: { videoId },
            });
            return {
                favorited: !existing,
                favoriteCount,
            };
        });
    }
    async incrementWatchCount(videoId) {
        return this.prisma.$transaction(async (tx) => {
            const video = await tx.video.findFirst({
                where: { id: videoId, deletedAt: null },
                select: { id: true },
            });
            if (!video)
                throw new common_1.NotFoundException('Video not found');
            const updated = await tx.video.update({
                where: { id: videoId },
                data: {
                    watchCount: {
                        increment: 1,
                    },
                },
                select: { watchCount: true },
            });
            return updated.watchCount;
        });
    }
    async listFavoriteVideos(params) {
        const skip = (params.page - 1) * params.pageSize;
        const where = {
            userId: params.userId,
            video: {
                deletedAt: null,
            },
        };
        const [rows, total] = await this.prisma.$transaction([
            this.prisma.videoFavorite.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: params.pageSize,
                include: {
                    video: {
                        include: { category: true, _count: { select: { likes: true, favorites: true } } },
                    },
                },
            }),
            this.prisma.videoFavorite.count({ where }),
        ]);
        return {
            items: rows.map((row) => row.video),
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize) || 1,
        };
    }
    async clearGifMetadata(videoId) {
        try {
            return await this.prisma.video.update({
                where: { id: videoId },
                data: {
                    telegramGifFileId: null,
                    telegramGifMessageId: null,
                    telegramGifChannelId: null,
                },
            });
        }
        catch (error) {
            if (error?.code === 'P2025')
                return null;
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