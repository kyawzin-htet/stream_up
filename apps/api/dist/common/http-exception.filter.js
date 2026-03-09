"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalizedHttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const i18n_1 = require("./i18n");
let LocalizedHttpExceptionFilter = class LocalizedHttpExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const status = exception.getStatus();
        const response = exception.getResponse();
        const language = (0, i18n_1.resolveLanguage)(req);
        const localized = (0, i18n_1.localizeMessage)(response, language);
        if (res.headersSent)
            return;
        if (typeof localized === 'string') {
            res.status(status).json({ statusCode: status, message: localized });
            return;
        }
        res.status(status).json(localized);
    }
};
exports.LocalizedHttpExceptionFilter = LocalizedHttpExceptionFilter;
exports.LocalizedHttpExceptionFilter = LocalizedHttpExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException)
], LocalizedHttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map