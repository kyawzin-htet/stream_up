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
    async uploadImages(params) {
        const uploaded = await Promise.all(params.files.map(async (file) => {
            const caption = params.isPremium ? 'Gallery image (Premium)' : 'Gallery image (Free)';
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
        const created = await this.prisma.$transaction(uploaded.map((item) => this.prisma.galleryImage.create({
            data: item,
        })));
        return {
            count: created.length,
            items: created,
        };
    }
    async list(params) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.galleryImage.findMany({
                orderBy: { createdAt: 'desc' },
                skip: (params.page - 1) * params.pageSize,
                take: params.pageSize,
            }),
            this.prisma.galleryImage.count(),
        ]);
        return {
            items,
            total,
            page: params.page,
            pageSize: params.pageSize,
            totalPages: Math.ceil(total / params.pageSize) || 1,
        };
    }
    async getById(id) {
        const image = await this.prisma.galleryImage.findUnique({ where: { id } });
        if (!image)
            throw new common_1.NotFoundException('Image not found');
        return image;
    }
    async getImageStream(id) {
        const image = await this.getById(id);
        const fileInfo = await this.telegram.getFile(image.telegramFileId);
        const response = await this.telegram.fetchFileStream(fileInfo.file_path);
        return response;
    }
};
exports.GalleryImagesService = GalleryImagesService;
exports.GalleryImagesService = GalleryImagesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        telegram_service_1.TelegramService])
], GalleryImagesService);
//# sourceMappingURL=gallery-images.service.js.map