import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class VideosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  private buildSearchFilter(query?: string) {
    if (!query) return undefined;
    const tokens = query
      .split(/\s+/)
      .map((t) => t.trim())
      .filter(Boolean);

    return [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
      tokens.length ? { keywords: { hasSome: tokens } } : undefined,
    ].filter(Boolean);
  }

  async createVideo(params: {
    file: Express.Multer.File;
    title: string;
    description: string;
    categoryId: string;
    keywords: string[];
    isPremium: boolean;
    uploaderId?: string;
  }) {
    const caption = `${params.title}\n\n${params.description}`;
    const result = await this.telegram.sendVideoToChannel(params.file, caption);

    return this.prisma.video.create({
      data: {
        title: params.title,
        description: params.description,
        categoryId: params.categoryId,
        keywords: params.keywords,
        isPremium: params.isPremium,
        telegramFileId: result.video.file_id,
        telegramMessageId: String(result.message_id),
        telegramChannelId: String(result.chat.id),
        uploaderId: params.uploaderId,
      },
      include: { category: true },
    });
  }

  async listVideos(params: {
    query?: string;
    category?: string;
    premium?: boolean | null;
    page: number;
    pageSize: number;
  }) {
    const where: any = { deletedAt: null };

    if (params.category) {
      where.category = { slug: params.category };
    }

    if (typeof params.premium === 'boolean') {
      where.isPremium = params.premium;
    }

    if (params.query) {
      where.OR = this.buildSearchFilter(params.query);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async getVideo(id: string) {
    const video = await this.prisma.video.findFirst({
      where: { id, deletedAt: null },
      include: { category: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async getVideoIncludingDeleted(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async listDeletedVideos(params: { page: number; pageSize: number; query?: string }) {
    const where: any = { deletedAt: { not: null } };
    if (params.query) {
      where.OR = this.buildSearchFilter(params.query);
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        include: { category: true },
        orderBy: { deletedAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async softDeleteVideo(id: string, deletedById?: string | null) {
    try {
      return await this.prisma.video.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: deletedById || null,
        },
        include: { category: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Video not found');
      throw error;
    }
  }

  async restoreVideo(id: string) {
    try {
      return await this.prisma.video.update({
        where: { id },
        data: { deletedAt: null, deletedById: null },
        include: { category: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Video not found');
      throw error;
    }
  }

  async deleteVideo(id: string) {
    try {
      return await this.prisma.video.delete({
        where: { id },
        include: { category: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Video not found');
      throw error;
    }
  }
}
