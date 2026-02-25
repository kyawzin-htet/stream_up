"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembershipsModule = void 0;
const common_1 = require("@nestjs/common");
const memberships_service_1 = require("./memberships.service");
const memberships_controller_1 = require("./memberships.controller");
const membership_upgrades_controller_1 = require("./membership-upgrades.controller");
const admin_membership_upgrades_controller_1 = require("./admin-membership-upgrades.controller");
const pricing_controller_1 = require("./pricing.controller");
const users_module_1 = require("../users/users.module");
const telegram_module_1 = require("../telegram/telegram.module");
let MembershipsModule = class MembershipsModule {
};
exports.MembershipsModule = MembershipsModule;
exports.MembershipsModule = MembershipsModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, telegram_module_1.TelegramModule],
        providers: [memberships_service_1.MembershipsService],
        controllers: [
            memberships_controller_1.MembershipsController,
            membership_upgrades_controller_1.MembershipUpgradesController,
            admin_membership_upgrades_controller_1.AdminMembershipUpgradesController,
            pricing_controller_1.PricingController,
        ],
        exports: [memberships_service_1.MembershipsService],
    })
], MembershipsModule);
//# sourceMappingURL=memberships.module.js.map