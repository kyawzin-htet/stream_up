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
exports.PricingController = void 0;
const common_1 = require("@nestjs/common");
const memberships_service_1 = require("./memberships.service");
const public_decorator_1 = require("../common/public.decorator");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../common/admin.guard");
let PricingController = class PricingController {
    constructor(memberships) {
        this.memberships = memberships;
    }
    async listPlans() {
        const [settings, plans] = await Promise.all([
            this.memberships.getPricingSettings(),
            this.memberships.listPlans(),
        ]);
        return {
            currency: settings?.currency || 'USD',
            plans: plans.filter((plan) => plan.active),
        };
    }
    async listAllPlans() {
        const [settings, plans] = await Promise.all([
            this.memberships.getPricingSettings(),
            this.memberships.listPlans(),
        ]);
        return {
            currency: settings?.currency || 'USD',
            plans,
        };
    }
    async updateSettings(body) {
        if (!body.currency)
            return this.memberships.getPricingSettings();
        return this.memberships.updatePricingSettings(body.currency);
    }
    async updatePlan(id, body) {
        return this.memberships.updatePlan(id, body);
    }
};
exports.PricingController = PricingController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "listPlans", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('plans/all'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "listAllPlans", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Put)('settings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Put)('plans/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PricingController.prototype, "updatePlan", null);
exports.PricingController = PricingController = __decorate([
    (0, common_1.Controller)('pricing'),
    __metadata("design:paramtypes", [memberships_service_1.MembershipsService])
], PricingController);
//# sourceMappingURL=pricing.controller.js.map