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
exports.MembershipUpgradesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const memberships_service_1 = require("./memberships.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
let MembershipUpgradesController = class MembershipUpgradesController {
    constructor(memberships) {
        this.memberships = memberships;
    }
    async create(file, planId, note, user) {
        if (!file)
            throw new common_1.BadRequestException('Missing file');
        if (!planId)
            throw new common_1.BadRequestException('Missing plan');
        return this.memberships.createUpgradeRequest({
            userId: user.id,
            planId,
            note,
            file,
        });
    }
    async listMine(user) {
        return this.memberships.listUpgradeRequestsForUser(user.id);
    }
};
exports.MembershipUpgradesController = MembershipUpgradesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
                cb(new common_1.BadRequestException('Only JPG/PNG uploads are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('planId')),
    __param(2, (0, common_1.Body)('note')),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object, Object]),
    __metadata("design:returntype", Promise)
], MembershipUpgradesController.prototype, "create", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Get)('me'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MembershipUpgradesController.prototype, "listMine", null);
exports.MembershipUpgradesController = MembershipUpgradesController = __decorate([
    (0, common_1.Controller)('membership-upgrades'),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], MembershipUpgradesController);
//# sourceMappingURL=membership-upgrades.controller.js.map