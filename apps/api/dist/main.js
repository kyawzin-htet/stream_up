"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const helmet_1 = require("helmet");
const express_rate_limit_1 = require("express-rate-limit");
const app_module_1 = require("./app.module");
const config_1 = require("@nestjs/config");
const prisma_exception_filter_1 = require("./common/prisma-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    const config = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    const windowMs = Number(config.get('RATE_LIMIT_WINDOW_MS')) || 15 * 60 * 1000;
    const max = Number(config.get('RATE_LIMIT_MAX')) ||
        (process.env.NODE_ENV === 'production' ? 300 : 2000);
    const disabled = config.get('RATE_LIMIT_DISABLED') === 'true';
    if (!disabled) {
        app.use((0, express_rate_limit_1.default)({
            windowMs,
            max,
            standardHeaders: true,
            legacyHeaders: false,
        }));
    }
    app.enableCors({
        origin: [config.get('WEB_URL') ?? 'http://localhost:3000'],
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    app.useGlobalFilters(new prisma_exception_filter_1.PrismaExceptionFilter());
    const port = Number(process.env.PORT || 3001);
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map