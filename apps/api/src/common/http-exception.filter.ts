import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { Request, Response } from 'express';
import { localizeMessage, resolveLanguage } from './i18n';

@Catch(HttpException)
export class LocalizedHttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const response = exception.getResponse();
    const language = resolveLanguage(req);

    const localized = localizeMessage(response, language);

    if (res.headersSent) return;

    if (typeof localized === 'string') {
      res.status(status).json({ statusCode: status, message: localized });
      return;
    }

    res.status(status).json(localized as object);
  }
}
