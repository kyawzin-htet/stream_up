import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { VideosService } from './videos.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class VideosController {
    private readonly videos;
    private readonly users;
    private readonly telegram;
    private readonly jwt;
    private readonly logger;
    constructor(videos: VideosService, users: UsersService, telegram: TelegramService, jwt: JwtService);
    private cacheKey;
    private cachePath;
    private getCachedFile;
    private ensureCached;
    private streamFromCache;
    private warmCache;
    private removeCachedFile;
    private toClientVideo;
    private shouldClearGifMetadata;
    private ensureViewerCanAccess;
    private getDurationSeconds;
    private processVideo;
    private createGif;
    list(query?: string, category?: string, page?: string, pageSize?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    adminList(status?: 'active' | 'trashed', query?: string, premium?: string, page?: string, pageSize?: string): Promise<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    get(id: string): Promise<any>;
    upload(file: Express.Multer.File, dto: UploadVideoDto, user: {
        id: string;
    }): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
    } & {
        id: string;
        createdAt: Date;
        title: string;
        description: string;
        keywords: string[];
        telegramFileId: string;
        telegramMessageId: string;
        telegramChannelId: string;
        telegramGifFileId: string | null;
        telegramGifMessageId: string | null;
        telegramGifChannelId: string | null;
        isPremium: boolean;
        deletedAt: Date | null;
        categoryId: string;
        deletedById: string | null;
        uploaderId: string | null;
    }>;
    moveToTrash(id: string, user: {
        id: string;
    }): Promise<{
        id: string;
    }>;
    restore(id: string): Promise<{
        id: string;
    }>;
    remove(id: string): Promise<{
        id: string;
    }>;
    stream(id: string, res: Response): Promise<void>;
    preview(id: string, res: Response): Promise<void>;
    gif(id: string, res: Response): Promise<void>;
}
