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
exports.GalleryImagesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const telegram_service_1 = require("../telegram/telegram.service");
let GalleryImagesService = class GalleryImagesService {
    constructor(prisma, telegram) {
        this.prisma = prisma;
        this.telegram = telegram;
    }
    normalizeTags(tags) {
        return Array.from(new Set(tags
            .map((tag) => tag.trim().toLowerCase())
            .filter(Boolean)));
    }
    buildSearchFilter(query) {
        if (!query)
            return undefined;
        const normalized = query.trim();
        if (!normalized)
            return undefined;
        const tokens = normalized
            .split(/[,\s]+/)
            .map((token) => token.trim().toLowerCase())
            .filter(Boolean);
        return {
            OR: [
                { title: { contains: normalized, mode: 'insensitive' } },
                tokens.length ? { tags: { hasSome: tokens } } : undefined,
            ].filter(Boolean),
        };
    }
    mapGroup(group, likedByMe = false) {
        const images = (group.images || []).map((image) => ({
            id: image.id,
            createdAt: image.createdAt,
        }));
        return {
            id: group.id,
            title: group.title,
            tags: group.tags,
            isPremium: group.isPremium,
            createdAt: group.createdAt,
            uploaderId: group.uploaderId,
            imageCount: Number(group._count?.images || images.length || 0),
            likeCount: Number(group._count?.likes || 0),
            likedByMe,
            coverImage: images[0] || null,
            images,
        };
    }
    async uploadImages(params) {
        const normalizedTags = this.normalizeTags(params.tags);
        const normalizedTitle = (params.title || '').trim();
        const resolvedTitle = normalizedTitle || normalizedTags[0] || 'Untitled image set';
        const uploaded = await Promise.all(params.files.map(async (file) => {
            const caption = `${resolvedTitle}${params.isPremium ? ' (Premium)' : ''}`;
            const result = await this.telegram.sendPhotoToChannel(file, caption);
            const fileId = result?.photo?.[result.photo.length - 1]?.file_id;
            if (!fileId) {
                throw new Error('Telegram upload failed');
            }
            return {
                telegramFileId: fileId,
                telegramMessageId: String(result.message_id),
                telegramChannelId: String(result.chat.id),
                isPremium: params.isPremium,
                uploaderId: params.uploaderId,
            };
        }));
        const created = await this.prisma.galleryImageGroup.create({
            data: {
                title: resolvedTitle,
                tags: normalizedTags,
                isPremium: params.isPremium,
                uploaderId: params.uploaderId,
                images: {
                    create: uploaded,
                },
            },
            include: {
                images: {
                    select: { id: true, createdAt: true },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: {
                        images: true,
                        likes: true,
                    },
                },
            },
        });
        return {
            count: created._count.images,
            group: this.mapGroup(created),
        };
    }
    async list(params) {
        const where = this.buildSearchFilter(params.query);
        const [items, total] = await this.prisma.$transaction([
            this.prisma.galleryImageGroup.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize,
                include: {
                    images: {
                        select: { id: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                        take: 1,
                    },
                    _count: {
                        select: {
                            images: true,
                            likes: true,
                        },
                    },
                },
            }),
            this.prisma.galleryImageGroup.count({ where }),
        ]);
        const likedRows = params.userId
            ? await this.prisma.galleryImageLike.findMany({
                where: {
                    userId: params.userId,
                    groupId: { in: items.map((group) => group.id) },
                },
                select: {
                    groupId: true,
                },
            })
            : [];
        const likedIds = new Set(likedRows.map((row) => row.groupId));
        return {
            items: items.map((group) => this.mapGroup(group, likedIds.has(group.id))),
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize) || 1,
        };
    }
    async getGroupById(id, userId) {
        const [group, liked] = await Promise.all([
            this.prisma.galleryImageGroup.findUnique({
                where: { id },
                include: {
                    images: {
                        select: { id: true, createdAt: true },
                        orderBy: { createdAt: 'asc' },
                    },
                    _count: {
                        select: {
                            images: true,
                            likes: true,
                        },
                    },
                },
            }),
            userId
                ? this.prisma.galleryImageLike.findUnique({
                    where: {
                        userId_groupId: {
                            userId,
                            groupId: id,
                        },
                    },
                    select: { id: true },
                })
                : Promise.resolve(null),
        ]);
        if (!group)
            throw new common_1.NotFoundException('Image group not found');
        return this.mapGroup(group, Boolean(liked));
    }
    async getImageById(id) {
        const image = await this.prisma.galleryImage.findUnique({ where: { id } });
        if (!image)
            throw new common_1.NotFoundException('Image not found');
        return image;
    }
    async getImageStream(id) {
        const image = await this.getImageById(id);
        const fileInfo = await this.telegram.getFile(image.telegramFileId);
        return this.telegram.fetchFileStream(fileInfo.file_path);
    }
    async getLikeStatus(groupId, userId) {
        const group = await this.prisma.galleryImageGroup.findUnique({
            where: { id: groupId },
            include: {
                _count: {
                    select: {
                        likes: true,
                    },
                },
            },
        });
        if (!group)
            throw new common_1.NotFoundException('Image group not found');
        const liked = userId
            ? Boolean(await this.prisma.galleryImageLike.findUnique({
                where: {
                    userId_groupId: {
                        userId,
                        groupId,
                    },
                },
                select: { id: true },
            }))
            : false;
        return {
            liked,
            likeCount: Number(group._count.likes || 0),
        };
    }
    async toggleLike(groupId, userId) {
        return this.prisma.$transaction(async (tx) => {
            const group = await tx.galleryImageGroup.findUnique({
                where: { id: groupId },
                select: { id: true },
            });
            if (!group)
                throw new common_1.NotFoundException('Image group not found');
            const existing = await tx.galleryImageLike.findUnique({
                where: {
                    userId_groupId: {
                        userId,
                        groupId,
                    },
                },
                select: { id: true },
            });
            if (existing) {
                await tx.galleryImageLike.delete({
                    where: {
                        userId_groupId: {
                            userId,
                            groupId,
                        },
                    },
                });
            }
            else {
                await tx.galleryImageLike.create({
                    data: {
                        userId,
                        groupId,
                    },
                });
            }
            const likeCount = await tx.galleryImageLike.count({
                where: { groupId },
            });
            return {
                liked: !existing,
                likeCount,
            };
        });
    }
    async deleteGroup(id) {
        const group = await this.prisma.galleryImageGroup.findUnique({
            where: { id },
            include: {
                images: {
                    select: {
                        telegramChannelId: true,
                        telegramMessageId: true,
                    },
                },
            },
        });
        if (!group)
            throw new common_1.NotFoundException('Image group not found');
        await this.prisma.galleryImageGroup.delete({
            where: { id },
        });
        await Promise.allSettled(group.images.map((image) => this.telegram.deleteMessage(image.telegramChannelId, image.telegramMessageId)));
        return {
            deleted: true,
            id,
        };
    }
    async deleteGroups(ids) {
        const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
        if (!uniqueIds.length) {
            return { deletedCount: 0, ids: [] };
        }
        const groups = await this.prisma.galleryImageGroup.findMany({
            where: { id: { in: uniqueIds } },
            include: {
                images: {
                    select: {
                        telegramChannelId: true,
                        telegramMessageId: true,
                    },
                },
            },
        });
        if (!groups.length) {
            throw new common_1.NotFoundException('Image groups not found');
        }
        const existingIds = groups.map((group) => group.id);
        await this.prisma.galleryImageGroup.deleteMany({
            where: {
                id: { in: existingIds },
            },
        });
        await Promise.allSettled(groups.flatMap((group) => group.images.map((image) => this.telegram.deleteMessage(image.telegramChannelId, image.telegramMessageId))));
        return {
            deletedCount: existingIds.length,
            ids: existingIds,
        };
    }
};
exports.GalleryImagesService = GalleryImagesService;
exports.GalleryImagesService = GalleryImagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], GalleryImagesService);
//# sourceMappingURL=gallery-images.service.js.map