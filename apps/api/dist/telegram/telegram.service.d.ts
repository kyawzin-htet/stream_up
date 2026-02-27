import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class TelegramService {
    private readonly config;
    private readonly prisma;
    private readonly users;
    private readonly logger;
    constructor(config: ConfigService, prisma: PrismaService, users: UsersService);
    private get botToken();
    private get channelId();
    private get groupId();
    private apiUrl;
    sendVideoToChannel(file: Express.Multer.File, caption: string): Promise<any>;
    sendPhotoToChannel(file: Express.Multer.File, caption: string): Promise<any>;
    sendAnimationToChannel(file: Express.Multer.File, caption: string): Promise<any>;
    sendDocumentToChannel(file: Express.Multer.File, caption: string): Promise<any>;
    getFile(fileId: string): Promise<{
        file_path: string;
        file_size?: number;
    }>;
    fetchFileStream(filePath: string, range?: string): Promise<Response>;
    sendMessage(chatId: string, text: string): Promise<void>;
    createInviteLink(): Promise<string>;
    removeUserFromGroup(telegramUserId: string): Promise<void>;
    deleteMessage(chatId: string, messageId: string): Promise<void>;
    handleWebhookUpdate(update: any): Promise<void>;
    sendPremiumInvite(telegramUserId: string): Promise<void>;
    private withRetry;
}
