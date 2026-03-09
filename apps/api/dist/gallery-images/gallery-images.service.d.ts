import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class GalleryImagesService {
    private readonly prisma;
    private readonly telegram;
    constructor(prisma: PrismaService, telegram: TelegramService);
    private normalizeTags;
    private buildSearchFilter;
    private mapGroup;
    uploadImages(params: {
        files: Express.Multer.File[];
        isPremium: boolean;
        title?: string;
        tags: string[];
        uploaderId?: string;
    }): Promise<{
        count: number;
        group: {
            id: string;
            title: string;
            tags: string[];
            isPremium: boolean;
            createdAt: Date;
            uploaderId: string | null;
            imageCount: number;
            likeCount: number;
            likedByMe: boolean;
            coverImage: {
                id: string;
                createdAt: Date;
            };
            images: {
                id: string;
                createdAt: Date;
            }[];
        };
    }>;
    list(params: {
        page: number;
        pageSize: number;
        query?: string;
        userId?: string;
    }): Promise<{
        items: {
            id: string;
            title: string;
            tags: string[];
            isPremium: boolean;
            createdAt: Date;
            uploaderId: string | null;
            imageCount: number;
            likeCount: number;
            likedByMe: boolean;
            coverImage: {
                id: string;
                createdAt: Date;
            };
            images: {
                id: string;
                createdAt: Date;
            }[];
        }[];
        total: number;
        page: number;
        pageSize: number;
        totalPages: number;
    }>;
    getGroupById(id: string, userId?: string): Promise<{
        id: string;
        title: string;
        tags: string[];
        isPremium: boolean;
        createdAt: Date;
        uploaderId: string | null;
        imageCount: number;
        likeCount: number;
        likedByMe: boolean;
        coverImage: {
            id: string;
            createdAt: Date;
        };
        images: {
            id: string;
            createdAt: Date;
        }[];
    }>;
    getImageById(id: string): Promise<{
        id: string;
        createdAt: Date;
        telegramFileId: string;
        telegramMessageId: string;
        telegramChannelId: string;
        isPremium: boolean;
        uploaderId: string | null;
        groupId: string;
    }>;
    getImageStream(id: string): Promise<Response>;
    getLikeStatus(groupId: string, userId?: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    toggleLike(groupId: string, userId: string): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    deleteGroup(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    deleteGroups(ids: string[]): Promise<{
        deletedCount: number;
        ids: string[];
    }>;
}
