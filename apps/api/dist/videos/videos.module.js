"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const videos_controller_1 = require("./videos.controller");
const videos_service_1 = require("./videos.service");
const telegram_module_1 = require("../telegram/telegram.module");
const users_module_1 = require("../users/users.module");
let VideosModule = class VideosModule {
};
exports.VideosModule = VideosModule;
exports.VideosModule = VideosModule = __decorate([
    (0, common_1.Module)({
        imports: [
            telegram_module_1.TelegramModule,
            users_module_1.UsersModule,
            jwt_1.JwtModule.registerAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('JWT_SECRET') || 'change-me',
                    signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') || '7d' },
                }),
            }),
        ],
        controllers: [videos_controller_1.VideosController],
        providers: [videos_service_1.VideosService],
        exports: [videos_service_1.VideosService],
    })
], VideosModule);
//# sourceMappingURL=videos.module.js.map