import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
export declare class CategoriesController {
    private readonly categories;
    constructor(categories: CategoriesService);
    list(): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }[]>;
    create(dto: CreateCategoryDto): Promise<{
        id: string;
        createdAt: Date;
        name: string;
        slug: string;
    }>;
}
