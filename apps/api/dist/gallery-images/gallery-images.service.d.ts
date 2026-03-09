import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class GalleryImagesService {
    private readonly prisma;
    private readonly telegram;
    constructor(prisma: PrismaService, telegram: TelegramService);
    uploadImages(params: {
        files: Express.Multer.File[];
        isPremium: boolean;
        uploaderId?: string;
    }): Promise<{
        count: number;
        items: {
            id: string;
            createdAt: Date;
            telegramFileId: string;
            telegramMessageId: string;
            telegramChannelId: string;
            isPremium: boolean;
            uploaderId: string | null;
        }[];
    }>;
    list(params: {
        page: number;
        pageSize: number;
    }): Promise<{
        items: {
            id: string;
            createdAt: Date;
            telegramFileId: string;
            telegramMessageId: string;
            telegramChannelId: string;
            isPremium: boolean;
            uploaderId: string | null;
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getById(id: string): Promise<{
        id: string;
        createdAt: Date;
        telegramFileId: string;
        telegramMessageId: string;
        telegramChannelId: string;
        isPremium: boolean;
        uploaderId: string | null;
    }>;
    getImageStream(id: string): Promise<Response>;
}
