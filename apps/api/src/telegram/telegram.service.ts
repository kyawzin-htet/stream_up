import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

const TELEGRAM_API = 'https://api.telegram.org';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  private get botToken() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN');
    return token;
  }

  private get channelId() {
    const id = this.config.get<string>('TELEGRAM_CHANNEL_ID');
    if (!id) throw new Error('Missing TELEGRAM_CHANNEL_ID');
    return id;
  }

  private get groupId() {
    const id = this.config.get<string>('TELEGRAM_GROUP_ID');
    if (!id) throw new Error('Missing TELEGRAM_GROUP_ID');
    return id;
  }

  private apiUrl(path: string) {
    return `${TELEGRAM_API}/bot${this.botToken}/${path}`;
  }

  async sendVideoToChannel(file: Express.Multer.File, caption: string) {
    const form = new FormData();
    form.append('chat_id', this.channelId);
    form.append('supports_streaming', 'true');
    form.append('caption', caption);

    const bytes = new Uint8Array(file.buffer);
    const blob = new Blob([bytes], { type: file.mimetype });
    form.append('video', blob, file.originalname);

    const response = await this.withRetry(() =>
      fetch(this.apiUrl('sendVideo'), {
        method: 'POST',
        body: form,
      }),
    );

    const payload = await response.json();
    if (!payload.ok) {
      this.logger.error(`Telegram sendVideo failed: ${payload.description}`);
      throw new Error('Telegram upload failed');
    }

    return payload.result;
  }

  async sendPhotoToChannel(file: Express.Multer.File, caption: string) {
    const form = new FormData();
    form.append('chat_id', this.channelId);
    form.append('caption', caption);

    const bytes = new Uint8Array(file.buffer);
    const blob = new Blob([bytes], { type: file.mimetype });
    form.append('photo', blob, file.originalname);

    const response = await this.withRetry(() =>
      fetch(this.apiUrl('sendPhoto'), {
        method: 'POST',
        body: form,
      }),
    );

    const payload = await response.json();
    if (!payload.ok) {
      this.logger.error(`Telegram sendPhoto failed: ${payload.description}`);
      throw new Error('Telegram upload failed');
    }

    return payload.result;
  }

  async getFile(fileId: string) {
    const response = await this.withRetry(() =>
      fetch(this.apiUrl(`getFile?file_id=${encodeURIComponent(fileId)}`)),
    );
    const payload = await response.json();
    if (!payload.ok) throw new Error('Telegram getFile failed');
    return payload.result as { file_path: string; file_size?: number };
  }

  async fetchFileStream(filePath: string, range?: string) {
    const url = `${TELEGRAM_API}/file/bot${this.botToken}/${filePath}`;
    const response = await this.withRetry(() =>
      fetch(url, {
        headers: range ? { Range: range } : undefined,
      }),
    );
    return response;
  }

  async sendMessage(chatId: string, text: string) {
    await this.withRetry(() =>
      fetch(this.apiUrl('sendMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text }),
      }),
    );
  }

  async createInviteLink() {
    const response = await this.withRetry(() =>
      fetch(this.apiUrl('createChatInviteLink'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.groupId,
          name: `premium-${Date.now()}`,
          creates_join_request: false,
          member_limit: 1,
        }),
      }),
    );
    const payload = await response.json();
    if (!payload.ok) throw new Error('Telegram invite link failed');
    return payload.result.invite_link as string;
  }

  async removeUserFromGroup(telegramUserId: string) {
    await this.withRetry(() =>
      fetch(this.apiUrl('banChatMember'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.groupId,
          user_id: Number(telegramUserId),
          revoke_messages: true,
        }),
      }),
    );

    await this.withRetry(() =>
      fetch(this.apiUrl('unbanChatMember'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.groupId,
          user_id: Number(telegramUserId),
        }),
      }),
    );
  }

  async deleteMessage(chatId: string, messageId: string) {
    const response = await this.withRetry(() =>
      fetch(this.apiUrl('deleteMessage'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: Number(messageId),
        }),
      }),
    );

    const payload = await response.json();
    if (!payload.ok) {
      this.logger.warn(`Telegram deleteMessage failed: ${payload.description}`);
      throw new Error('Telegram deleteMessage failed');
    }
  }

  async handleWebhookUpdate(update: any) {
    const message = update?.message || update?.edited_message;
    if (!message?.text) return;

    if (message.text.startsWith('/start')) {
      // Deep-link flow: /start link_<token> ties Telegram user to an existing web account.
      const parts = message.text.split(' ');
      const param = parts[1] || '';
      if (!param.startsWith('link_')) return;

      const token = param.replace('link_', '');
      const link = await this.prisma.telegramLinkToken.findUnique({
        where: { token },
      });

      if (!link) {
        await this.sendMessage(String(message.chat.id), 'Link token not found.');
        return;
      }

      if (link.usedAt || link.expiresAt.getTime() < Date.now()) {
        await this.sendMessage(String(message.chat.id), 'Link token expired.');
        return;
      }

      await this.users.updateTelegramUserId(link.userId, String(message.from.id));
      await this.prisma.telegramLinkToken.update({
        where: { id: link.id },
        data: { usedAt: new Date() },
      });

      const user = await this.users.findById(link.userId);
      await this.sendMessage(String(message.chat.id), 'Telegram account linked.');

      if (
        user.membershipType === 'PREMIUM' &&
        (!user.membershipExpiresAt || user.membershipExpiresAt.getTime() > Date.now())
      ) {
        await this.sendPremiumInvite(String(message.from.id));
      }
    }
  }

  async sendPremiumInvite(telegramUserId: string) {
    const link = await this.createInviteLink();
    await this.sendMessage(telegramUserId, `Premium access link: ${link}`);
  }

  private async withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
    let lastError: any;
    for (let i = 0; i < attempts; i += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        this.logger.warn(`Telegram attempt ${i + 1} failed: ${String(error)}`);
        await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
      }
    }
    throw lastError;
  }
}
