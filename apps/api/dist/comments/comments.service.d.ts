import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
export declare class CommentsService {
    private readonly prisma;
    private readonly users;
    private readonly config;
    constructor(prisma: PrismaService, users: UsersService, config: ConfigService);
    private isAdmin;
    private ensureCanComment;
    listByVideo(videoId: string): Promise<({
        user: {
            id: string;
            email: string;
        };
        replies: ({
            user: {
                id: string;
                email: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            body: string;
            videoId: string;
            parentId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        body: string;
        videoId: string;
        parentId: string | null;
    })[]>;
    createComment(params: {
        videoId?: string;
        userId: string;
        body: string;
        parentId?: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        body: string;
        videoId: string;
        parentId: string | null;
    }>;
}
