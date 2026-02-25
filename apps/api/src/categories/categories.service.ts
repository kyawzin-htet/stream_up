import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(name: string, slug: string) {
    return this.prisma.category.create({ data: { name, slug } });
  }
}
