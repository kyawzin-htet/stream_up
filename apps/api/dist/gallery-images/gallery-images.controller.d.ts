import type { Response } from 'express';
import { GalleryImagesService } from './gallery-images.service';
export declare class GalleryImagesController {
    private readonly gallery;
    constructor(gallery: GalleryImagesService);
    list(page?: string, pageSize?: string): Promise<{
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
    upload(files: Express.Multer.File[], isPremiumRaw: string | undefined, user: {
        id: string;
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
    streamImage(id: string, res: Response): Promise<void>;
}
