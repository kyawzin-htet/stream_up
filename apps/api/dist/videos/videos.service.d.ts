import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class VideosService {
    private readonly prisma;
    private readonly telegram;
    private readonly logger;
    constructor(prisma: PrismaService, telegram: TelegramService);
    private buildSearchFilter;
    createVideo(params: {
        file: Express.Multer.File;
        gifFile: Express.Multer.File;
        title: string;
        description: string;
        categoryId: string;
        keywords: string[];
        isPremium: boolean;
        uploaderId?: string;
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
    listVideos(params: {
        query?: string;
        category?: string;
        premium?: boolean | null;
        sort?: 'latest' | 'popular';
        page: number;
        pageSize: number;
    }): Promise<{
        items: ({
            category: {
                id: string;
                createdAt: Date;
                name: string;
                slug: string;
            };
            _count: {
                likes: number;
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getVideo(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
        _count: {
            likes: number;
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
    getVideoIncludingDeleted(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
        _count: {
            likes: number;
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
    listDeletedVideos(params: {
        page: number;
        pageSize: number;
        query?: string;
    }): Promise<{
        items: ({
            category: {
                id: string;
                createdAt: Date;
                name: string;
                slug: string;
            };
            _count: {
                likes: number;
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
        })[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    softDeleteVideo(id: string, deletedById?: string | null): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
        _count: {
            likes: number;
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
    restoreVideo(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
        _count: {
            likes: number;
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
    deleteVideo(id: string): Promise<{
        category: {
            id: string;
            createdAt: Date;
            name: string;
            slug: string;
        };
        _count: {
            likes: number;
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
    getLikedVideoIds(userId: string, videoIds: string[]): Promise<string[]>;
    isVideoLikedByUser(videoId: string, userId: string): Promise<boolean>;
    toggleLike(videoId: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    clearGifMetadata(videoId: string): Promise<{
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
    } | null>;
}
