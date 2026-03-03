"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const users_service_1 = require("../users/users.service");
const TELEGRAM_API = 'https://api.telegram.org';
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(config, prisma, users) {
        this.config = config;
        this.prisma = prisma;
        this.users = users;
        this.logger = new common_1.Logger(TelegramService_1.name);
    }
    redactToken(message) {
        const token = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!token)
            return message;
        return message.split(token).join('[REDACTED]');
    }
    get botToken() {
        const token = this.config.get('TELEGRAM_BOT_TOKEN');
        if (!token)
            throw new Error('Missing TELEGRAM_BOT_TOKEN');
        return token;
    }
    get channelId() {
        const id = this.config.get('TELEGRAM_CHANNEL_ID');
        if (!id)
            throw new Error('Missing TELEGRAM_CHANNEL_ID');
        return id;
    }
    get groupId() {
        const id = this.config.get('TELEGRAM_GROUP_ID');
        if (!id)
            throw new Error('Missing TELEGRAM_GROUP_ID');
        return id;
    }
    apiUrl(path) {
        return `${TELEGRAM_API}/bot${this.botToken}/${path}`;
    }
    async sendVideoToChannel(file, caption) {
        const form = new FormData();
        form.append('chat_id', this.channelId);
        form.append('supports_streaming', 'true');
        form.append('caption', caption);
        const bytes = new Uint8Array(file.buffer);
        const blob = new Blob([bytes], { type: file.mimetype });
        form.append('video', blob, file.originalname);
        const response = await this.withRetry(() => fetch(this.apiUrl('sendVideo'), {
            method: 'POST',
            body: form,
        }));
        const payload = await response.json();
        if (!payload.ok) {
            this.logger.error(`Telegram sendVideo failed: ${payload.description}`);
            throw new Error('Telegram upload failed');
        }
        return payload.result;
    }
    async sendPhotoToChannel(file, caption) {
        const form = new FormData();
        form.append('chat_id', this.channelId);
        form.append('caption', caption);
        const bytes = new Uint8Array(file.buffer);
        const blob = new Blob([bytes], { type: file.mimetype });
        form.append('photo', blob, file.originalname);
        const response = await this.withRetry(() => fetch(this.apiUrl('sendPhoto'), {
            method: 'POST',
            body: form,
        }));
        const payload = await response.json();
        if (!payload.ok) {
            this.logger.error(`Telegram sendPhoto failed: ${payload.description}`);
            throw new Error('Telegram upload failed');
        }
        return payload.result;
    }
    async sendAnimationToChannel(file, caption) {
        const form = new FormData();
        form.append('chat_id', this.channelId);
        form.append('caption', caption);
        const bytes = new Uint8Array(file.buffer);
        const blob = new Blob([bytes], { type: file.mimetype || 'image/gif' });
        form.append('animation', blob, file.originalname);
        const response = await this.withRetry(() => fetch(this.apiUrl('sendAnimation'), {
            method: 'POST',
            body: form,
        }));
        const payload = await response.json();
        if (!payload.ok) {
            this.logger.error(`Telegram sendAnimation failed: ${payload.description}`);
            throw new Error('Telegram upload failed');
        }
        return payload.result;
    }
    async sendDocumentToChannel(file, caption) {
        const form = new FormData();
        form.append('chat_id', this.channelId);
        form.append('caption', caption);
        const bytes = new Uint8Array(file.buffer);
        const blob = new Blob([bytes], { type: file.mimetype || 'application/octet-stream' });
        form.append('document', blob, file.originalname);
        const response = await this.withRetry(() => fetch(this.apiUrl('sendDocument'), {
            method: 'POST',
            body: form,
        }));
        const payload = await response.json();
        if (!payload.ok) {
            this.logger.error(`Telegram sendDocument failed: ${payload.description}`);
            throw new Error('Telegram upload failed');
        }
        return payload.result;
    }
    async getFile(fileId) {
        const response = await this.withRetry(() => fetch(this.apiUrl(`getFile?file_id=${encodeURIComponent(fileId)}`)));
        const payload = await response.json();
        if (!payload.ok) {
            const description = String(payload?.description || '').trim();
            throw new Error(description ? `Telegram getFile failed: ${description}` : 'Telegram getFile failed');
        }
        return payload.result;
    }
    async fetchFileStream(filePath, range) {
        const url = `${TELEGRAM_API}/file/bot${this.botToken}/${filePath}`;
        const response = await this.withRetry(() => fetch(url, {
            headers: range ? { Range: range } : undefined,
        }));
        return response;
    }
    async sendMessage(chatId, text) {
        await this.withRetry(() => fetch(this.apiUrl('sendMessage'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text }),
        }));
    }
    async createInviteLink() {
        const response = await this.withRetry(() => fetch(this.apiUrl('createChatInviteLink'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.groupId,
                name: `premium-${Date.now()}`,
                creates_join_request: false,
                member_limit: 1,
            }),
        }));
        const payload = await response.json();
        if (!payload.ok)
            throw new Error('Telegram invite link failed');
        return payload.result.invite_link;
    }
    async removeUserFromGroup(telegramUserId) {
        await this.withRetry(() => fetch(this.apiUrl('banChatMember'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.groupId,
                user_id: Number(telegramUserId),
                revoke_messages: true,
            }),
        }));
        await this.withRetry(() => fetch(this.apiUrl('unbanChatMember'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: this.groupId,
                user_id: Number(telegramUserId),
            }),
        }));
    }
    async deleteMessage(chatId, messageId) {
        const response = await this.withRetry(() => fetch(this.apiUrl('deleteMessage'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                message_id: Number(messageId),
            }),
        }));
        const payload = await response.json();
        if (!payload.ok) {
            this.logger.warn(`Telegram deleteMessage failed: ${payload.description}`);
            throw new Error('Telegram deleteMessage failed');
        }
    }
    async handleWebhookUpdate(update) {
        const message = update?.message || update?.edited_message;
        if (!message?.text)
            return;
        if (message.text.startsWith('/start')) {
            const parts = message.text.split(' ');
            const param = parts[1] || '';
            if (!param.startsWith('link_'))
                return;
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
            if (user.membershipType === 'PREMIUM' &&
                (!user.membershipExpiresAt || user.membershipExpiresAt.getTime() > Date.now())) {
                await this.sendPremiumInvite(String(message.from.id));
            }
        }
    }
    async sendPremiumInvite(telegramUserId) {
        const link = await this.createInviteLink();
        await this.sendMessage(telegramUserId, `Premium access link: ${link}`);
    }
    async withRetry(fn, attempts = 3) {
        let lastError;
        for (let i = 0; i < attempts; i += 1) {
            try {
                return await fn();
            }
            catch (error) {
                lastError = error;
                this.logger.warn(`Telegram attempt ${i + 1} failed: ${this.redactToken(String(error))}`);
                await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
            }
        }
        throw lastError;
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService,
        users_service_1.UsersService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map