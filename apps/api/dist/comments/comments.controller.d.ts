import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';
export declare class CommentsController {
    private readonly comments;
    constructor(comments: CommentsService);
    list(id: string): Promise<({
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
            videoId: string;
            body: string;
            parentId: string | null;
        })[];
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        videoId: string;
        body: string;
        parentId: string | null;
    })[]>;
    create(id: string, dto: CreateCommentDto, user: {
        id: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        videoId: string;
        body: string;
        parentId: string | null;
    }>;
    reply(id: string, dto: CreateCommentDto, user: {
        id: string;
    }): Promise<{
        user: {
            id: string;
            email: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        videoId: string;
        body: string;
        parentId: string | null;
    }>;
}
