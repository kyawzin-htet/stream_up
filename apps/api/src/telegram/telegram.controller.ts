import { Body, Controller, ForbiddenException, Headers, Post } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { Public } from '../common/public.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('telegram')
export class TelegramController {
  constructor(private readonly telegram: TelegramService, private readonly config: ConfigService) {}

  @Public()
  @Post('webhook')
  async webhook(@Body() update: any, @Headers('x-telegram-bot-api-secret-token') secret?: string) {
    const expected = this.config.get<string>('TELEGRAM_WEBHOOK_SECRET');
    // Secret is ALWAYS required — reject if env var is missing (misconfigured server)
    // or if the incoming token doesn't match.
    if (!expected || secret !== expected) {
      throw new ForbiddenException('Invalid webhook secret');
    }

    await this.telegram.handleWebhookUpdate(update);
    return { ok: true };
  }
}
