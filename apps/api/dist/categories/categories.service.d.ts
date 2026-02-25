import { PrismaService } from '../prisma/prisma.service';
export declare class CategoriesService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }[]>;
    create(name: string, slug: string): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
}
