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
var AdminMembershipUpgradesController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminMembershipUpgradesController = void 0;
const common_1 = require("@nestjs/common");
const stream_1 = require("stream");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../common/admin.guard");
const memberships_service_1 = require("./memberships.service");
const telegram_service_1 = require("../telegram/telegram.service");
const current_user_decorator_1 = require("../common/current-user.decorator");
const client_1 = require("@prisma/client");
let AdminMembershipUpgradesController = AdminMembershipUpgradesController_1 = class AdminMembershipUpgradesController {
    constructor(memberships, telegram) {
        this.memberships = memberships;
        this.telegram = telegram;
        this.logger = new common_1.Logger(AdminMembershipUpgradesController_1.name);
    }
    async list(status, page = '1', pageSize = '20') {
        const allowed = ['PENDING', 'APPROVED', 'REJECTED'];
        const safeStatus = status && allowed.includes(status) ? status : undefined;
        return this.memberships.listUpgradeRequestsAdmin({
            status: safeStatus,
            page: Math.max(1, Number(page) || 1),
            pageSize: Math.min(50, Math.max(1, Number(pageSize) || 20)),
        });
    }
    async summary() {
        return this.memberships.upgradeSummary();
    }
    async approve(id, user) {
        return this.memberships.approveUpgradeRequest(id, user.id);
    }
    async reject(id, user) {
        return this.memberships.rejectUpgradeRequest(id, user.id);
    }
    async slip(id, res) {
        const request = await this.memberships.getUpgradeRequest(id);
        const fileInfo = await this.telegram.getFile(request.paymentSlipFileId);
        const range = res.req.headers.range;
        const fileResponse = await this.telegram.fetchFileStream(fileInfo.file_path, range);
        if (!fileResponse.ok || !fileResponse.body) {
            res.status(502).json({ message: 'Failed to load pay slip' });
            return;
        }
        const headers = {
            'Content-Type': fileResponse.headers.get('content-type') || 'image/jpeg',
            'Content-Length': fileResponse.headers.get('content-length') || '',
        };
        const contentRange = fileResponse.headers.get('content-range');
        if (contentRange)
            headers['Content-Range'] = contentRange;
        const acceptRanges = fileResponse.headers.get('accept-ranges');
        if (acceptRanges)
            headers['Accept-Ranges'] = acceptRanges;
        const statusCode = fileResponse.status;
        res.status(statusCode);
        Object.entries(headers).forEach(([key, value]) => {
            if (value)
                res.setHeader(key, value);
        });
        const bodyStream = fileResponse.body;
        const cancelUpstream = () => {
            if (!bodyStream)
                return;
            try {
                if ('locked' in bodyStream && bodyStream.locked)
                    return;
                const result = bodyStream.cancel();
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { });
                }
            }
            catch { }
        };
        const stream = stream_1.Readable.fromWeb(fileResponse.body);
        stream.on('error', (error) => {
            this.logger.warn(`Slip stream error for request ${id}: ${String(error)}`);
            if (!res.headersSent)
                res.status(499);
            res.end();
        });
        res.on('close', () => {
            cancelUpstream();
            stream.destroy();
        });
        stream.pipe(res);
    }
};
exports.AdminMembershipUpgradesController = AdminMembershipUpgradesController;
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminMembershipUpgradesController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminMembershipUpgradesController.prototype, "summary", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminMembershipUpgradesController.prototype, "approve", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminMembershipUpgradesController.prototype, "reject", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)(':id/slip'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminMembershipUpgradesController.prototype, "slip", null);
exports.AdminMembershipUpgradesController = AdminMembershipUpgradesController = AdminMembershipUpgradesController_1 = __decorate([
    (0, common_1.Controller)('admin/membership-upgrades'),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService,
        telegram_service_1.TelegramService])
], AdminMembershipUpgradesController);
//# sourceMappingURL=admin-membership-upgrades.controller.js.map