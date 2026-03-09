"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PrismaExceptionFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const i18n_1 = require("./i18n");
let PrismaExceptionFilter = PrismaExceptionFilter_1 = class PrismaExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger(PrismaExceptionFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
        const language = (0, i18n_1.resolveLanguage)(req);
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Database request failed';
        let prismaCode;
        if (exception instanceof client_1.Prisma.PrismaClientInitializationError) {
            status = common_1.HttpStatus.SERVICE_UNAVAILABLE;
            message =
                'Database is unavailable. Start PostgreSQL and verify DATABASE_URL, then retry.';
        }
        else {
            prismaCode = exception.code;
            if (exception.code === 'P1001' || exception.code === 'P1002') {
                status = common_1.HttpStatus.SERVICE_UNAVAILABLE;
                message =
                    'Database is unavailable. Start PostgreSQL and verify DATABASE_URL, then retry.';
            }
            else if (exception.code === 'P2021' || exception.code === 'P2022') {
                status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
                message = 'Database schema is outdated. Run Prisma migrations and restart the API.';
            }
            else if (exception.code === 'P2002') {
                status = common_1.HttpStatus.CONFLICT;
                message = 'Unique constraint failed.';
            }
            else {
                message = exception.message;
            }
        }
        this.logger.error(`Prisma error${prismaCode ? ` (${prismaCode})` : ''}: ${exception.message}`, exception.stack);
        if (res.headersSent)
            return;
        res.status(status).json({
            statusCode: status,
            message: (0, i18n_1.localizeMessage)(message, language),
            ...(prismaCode ? { prismaCode } : {}),
        });
    }
};
exports.PrismaExceptionFilter = PrismaExceptionFilter;
exports.PrismaExceptionFilter = PrismaExceptionFilter = PrismaExceptionFilter_1 = __decorate([
    (0, common_1.Catch)(client_1.Prisma.PrismaClientKnownRequestError, client_1.Prisma.PrismaClientInitializationError)
], PrismaExceptionFilter);
//# sourceMappingURL=prisma-exception.filter.js.map