import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { PrismaExceptionFilter } from './common/prisma-exception.filter';
import { UsersService } from './users/users.service';
import { LocalizedHttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  // Do NOT pass { cors: true } here — that would open to all origins before enableCors() runs.
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.use(helmet());
  const windowMs =
    Number(config.get<string>('RATE_LIMIT_WINDOW_MS')) || 15 * 60 * 1000;
  const max =
    Number(config.get<string>('RATE_LIMIT_MAX')) ||
    (process.env.NODE_ENV === 'production' ? 300 : 2000);
  const disabled = config.get<string>('RATE_LIMIT_DISABLED') === 'true';
  if (!disabled) {
    app.use(
      rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
      }),
    );
  }

  app.enableCors({
    origin: [config.get<string>('WEB_URL') ?? 'http://localhost:3000'],
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new LocalizedHttpExceptionFilter(), new PrismaExceptionFilter());

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);

  // On startup: promote any email in ADMIN_EMAILS to the Admin table.
  // Safe to run repeatedly — uses upsert so existing admins are not re-created.
  const usersService = app.get(UsersService);
  const rawAdminEmails = config.get<string>('ADMIN_EMAILS') || '';
  const adminEmails = rawAdminEmails
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (adminEmails.length) {
    await usersService.seedAdminsFromEmails(adminEmails);
  }
}

void bootstrap();
