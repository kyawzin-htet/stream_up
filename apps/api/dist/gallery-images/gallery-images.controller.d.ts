import type { Response } from 'express';
import { GalleryImagesService } from './gallery-images.service';
export declare class GalleryImagesController {
    private readonly gallery;
    constructor(gallery: GalleryImagesService);
    private parseTags;
    list(page: string | undefined, pageSize: string | undefined, query: string | undefined, user: {
        id: string;
    } | null): Promise<{
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
    upload(files: Express.Multer.File[], isPremiumRaw: string | undefined, titleRaw: string | undefined, tagsRaw: string | string[] | undefined, user: {
        id: string;
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
    streamImage(id: string, res: Response): Promise<void>;
    getLikeStatus(id: string, user: {
        id: string;
    } | null): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    toggleLike(id: string, user: {
        id: string;
    }): Promise<{
        liked: boolean;
        likeCount: number;
    }>;
    get(id: string, user: {
        id: string;
    } | null): Promise<{
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
    remove(id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    bulkRemove(idsRaw: string[] | undefined): Promise<{
        deletedCount: number;
        ids: string[];
    }>;
}
