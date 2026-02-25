import { TelegramService } from './telegram.service';
import { ConfigService } from '@nestjs/config';
export declare class TelegramController {
    private readonly telegram;
    private readonly config;
    constructor(telegram: TelegramService, config: ConfigService);
    webhook(update: any, secret?: string): Promise<{
        ok: boolean;
    }>;
}
