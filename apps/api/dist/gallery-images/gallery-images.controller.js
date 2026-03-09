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
exports.GalleryImagesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const gallery_images_service_1 = require("./gallery-images.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const optional_jwt_auth_guard_1 = require("../auth/optional-jwt-auth.guard");
const admin_guard_1 = require("../common/admin.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const public_decorator_1 = require("../common/public.decorator");
let GalleryImagesController = class GalleryImagesController {
    constructor(gallery) {
        this.gallery = gallery;
    }
    parseTags(raw) {
        if (Array.isArray(raw)) {
            return raw
                .flatMap((value) => String(value).split(','))
                .map((value) => value.trim())
                .filter(Boolean);
        }
        return String(raw || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean);
    }
    async list(page = '1', pageSize = '24', query = '', user) {
        return this.gallery.list({
            page: Math.max(1, Number(page) || 1),
            pageSize: Math.min(100, Math.max(1, Number(pageSize) || 24)),
            query,
            userId: user?.id,
        });
    }
    async upload(files, isPremiumRaw, titleRaw, tagsRaw, user) {
        if (!files?.length)
            throw new common_1.BadRequestException('Missing file');
        const title = (titleRaw || '').trim();
        const tags = this.parseTags(tagsRaw);
        if (!title && tags.length === 0) {
            throw new common_1.BadRequestException('Title or tags are required');
        }
        const isPremium = isPremiumRaw === 'true';
        return this.gallery.uploadImages({
            files,
            isPremium,
            title,
            tags,
            uploaderId: user.id,
        });
    }
    async streamImage(id, res) {
        const response = await this.gallery.getImageStream(id);
        const body = await response.arrayBuffer();
        const headers = new Headers();
        const passthrough = [
            'content-type',
            'cache-control',
            'content-disposition',
            'etag',
            'last-modified',
            'vary',
        ];
        passthrough.forEach((key) => {
            const value = response.headers.get(key);
            if (value)
                headers.set(key, value);
        });
        headers.set('content-length', String(body.byteLength));
        res.status(response.status);
        headers.forEach((value, key) => {
            res.setHeader(key, value);
        });
        res.send(Buffer.from(body));
    }
    async getLikeStatus(id, user) {
        return this.gallery.getLikeStatus(id, user?.id);
    }
    async toggleLike(id, user) {
        return this.gallery.toggleLike(id, user.id);
    }
    async get(id, user) {
        return this.gallery.getGroupById(id, user?.id);
    }
    async remove(id) {
        return this.gallery.deleteGroup(id);
    }
    async bulkRemove(idsRaw) {
        const ids = Array.isArray(idsRaw)
            ? idsRaw.map((id) => String(id || '').trim()).filter(Boolean)
            : [];
        if (!ids.length) {
            throw new common_1.BadRequestException('Missing image group ids');
        }
        return this.gallery.deleteGroups(ids);
    }
};
exports.GalleryImagesController = GalleryImagesController;
__decorate([
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __param(2, (0, common_1.Query)('query')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 20, {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('image/')) {
                cb(new common_1.BadRequestException('Only image uploads are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFiles)()),
    __param(1, (0, common_1.Query)('isPremium')),
    __param(2, (0, common_1.Body)('title')),
    __param(3, (0, common_1.Body)('tags')),
    __param(4, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array, Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "upload", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/file'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "streamImage", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/like'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "getLikeStatus", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(':id/like'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "toggleLike", null);
__decorate([
    (0, common_1.UseGuards)(optional_jwt_auth_guard_1.OptionalJwtAuthGuard),
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "remove", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)('bulk-delete'),
    __param(0, (0, common_1.Body)('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GalleryImagesController.prototype, "bulkRemove", null);
exports.GalleryImagesController = GalleryImagesController = __decorate([
    (0, common_1.Controller)('gallery-images'),
    __metadata("design:paramtypes", [gallery_images_service_1.GalleryImagesService])
], GalleryImagesController);
//# sourceMappingURL=gallery-images.controller.js.map