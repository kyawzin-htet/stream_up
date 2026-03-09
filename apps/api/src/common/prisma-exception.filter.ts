import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { localizeMessage, resolveLanguage } from './i18n';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientInitializationError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(
    exception: Prisma.PrismaClientKnownRequestError | Prisma.PrismaClientInitializationError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();
    const language = resolveLanguage(req);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database request failed';
    let prismaCode: string | undefined;

    if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message =
        'Database is unavailable. Start PostgreSQL and verify DATABASE_URL, then retry.';
    } else {
      prismaCode = exception.code;
      if (exception.code === 'P1001' || exception.code === 'P1002') {
        status = HttpStatus.SERVICE_UNAVAILABLE;
        message =
          'Database is unavailable. Start PostgreSQL and verify DATABASE_URL, then retry.';
      } else if (exception.code === 'P2021' || exception.code === 'P2022') {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        message = 'Database schema is outdated. Run Prisma migrations and restart the API.';
      } else if (exception.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        message = 'Unique constraint failed.';
      } else {
        message = exception.message;
      }
    }

    this.logger.error(
      `Prisma error${prismaCode ? ` (${prismaCode})` : ''}: ${exception.message}`,
      (exception as Error).stack,
    );

    if (res.headersSent) return;
    res.status(status).json({
      statusCode: status,
      message: localizeMessage(message, language),
      ...(prismaCode ? { prismaCode } : {}),
    });
  }
}
