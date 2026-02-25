import { Body, Controller, Headers, Post } from '@nestjs/common';
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
    if (expected && secret !== expected) {
      return { ok: false };
    }

    await this.telegram.handleWebhookUpdate(update);
    return { ok: true };
  }
}
