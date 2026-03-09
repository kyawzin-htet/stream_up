"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GalleryImagesModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const gallery_images_controller_1 = require("./gallery-images.controller");
const gallery_images_service_1 = require("./gallery-images.service");
const telegram_module_1 = require("../telegram/telegram.module");
let GalleryImagesModule = class GalleryImagesModule {
};
exports.GalleryImagesModule = GalleryImagesModule;
exports.GalleryImagesModule = GalleryImagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            telegram_module_1.TelegramModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET') || 'change-me',
                    signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
                }),
            }),
        ],
        controllers: [gallery_images_controller_1.GalleryImagesController],
        providers: [gallery_images_service_1.GalleryImagesService],
    })
], GalleryImagesModule);
//# sourceMappingURL=gallery-images.module.js.map