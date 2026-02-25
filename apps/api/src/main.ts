import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
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

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
}

void bootstrap();
