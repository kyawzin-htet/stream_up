import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class VideosService {
  private readonly logger = new Logger(VideosService.name);

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
    gifFile: Express.Multer.File;
    title: string;
    description: string;
    categoryId: string;
    keywords: string[];
    isPremium: boolean;
    uploaderId?: string;
  }) {
    const caption = `${params.title}\n\n${params.description}`;
    const [videoResult, gifResult] = await Promise.all([
      this.telegram.sendVideoToChannel(params.file, caption),
      this.telegram.sendDocumentToChannel(params.gifFile, `${params.title}\n\nGIF preview`),
    ]);
    const gifFileId = gifResult?.document?.file_id || gifResult?.animation?.file_id;
    if (!gifFileId) {
      throw new Error('Telegram GIF upload missing file_id');
    }

    try {
      return await this.prisma.video.create({
        data: {
          title: params.title,
          description: params.description,
          categoryId: params.categoryId,
          keywords: params.keywords,
          isPremium: params.isPremium,
          telegramFileId: videoResult.video.file_id,
          telegramMessageId: String(videoResult.message_id),
          telegramChannelId: String(videoResult.chat.id),
          telegramGifFileId: gifFileId,
          telegramGifMessageId: String(gifResult.message_id),
          telegramGifChannelId: String(gifResult.chat.id),
          uploaderId: params.uploaderId,
        },
        include: { category: true },
      });
    } catch (error: any) {
      // Keep Telegram channel clean when DB write fails after successful uploads.
      await Promise.allSettled([
        this.telegram.deleteMessage(String(videoResult.chat.id), String(videoResult.message_id)),
        this.telegram.deleteMessage(String(gifResult.chat.id), String(gifResult.message_id)),
      ]);

      const message = String(error?.message || error);
      this.logger.error(`Failed to save video metadata: ${message}`);
      if (
        message.includes('telegramGifFileId') ||
        message.includes('telegramGifMessageId') ||
        message.includes('telegramGifChannelId') ||
        message.includes('column') ||
        message.includes('does not exist')
      ) {
        throw new InternalServerErrorException(
          'Database schema is outdated. Run Prisma migrations, then retry upload.',
        );
      }
      throw new InternalServerErrorException('Upload succeeded in Telegram but failed to save metadata.');
    }
  }

  async listVideos(params: {
    query?: string;
    category?: string;
    premium?: boolean | null;
    page: number;
    pageSize: number;
  }) {
    const where: any = {
      deletedAt: null,
    };

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
        include: { category: true, _count: { select: { likes: true } } },
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
      include: { category: true, _count: { select: { likes: true } } },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async getVideoIncludingDeleted(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { category: true, _count: { select: { likes: true } } },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async listDeletedVideos(params: { page: number; pageSize: number; query?: string }) {
    const where: any = {
      deletedAt: { not: null },
    };
    if (params.query) {
      where.OR = this.buildSearchFilter(params.query);
    }
    const [items, total] = await this.prisma.$transaction([
      this.prisma.video.findMany({
        where,
        include: { category: true, _count: { select: { likes: true } } },
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
        include: { category: true, _count: { select: { likes: true } } },
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
        include: { category: true, _count: { select: { likes: true } } },
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
        include: { category: true, _count: { select: { likes: true } } },
      });
    } catch (error: any) {
      if (error?.code === 'P2025') throw new NotFoundException('Video not found');
      throw error;
    }
  }

  async getLikedVideoIds(userId: string, videoIds: string[]) {
    if (!videoIds.length) return [];
    const rows = await this.prisma.videoLike.findMany({
      where: {
        userId,
        videoId: { in: videoIds },
      },
      select: { videoId: true },
    });
    return rows.map((row) => row.videoId);
  }

  async isVideoLikedByUser(videoId: string, userId: string) {
    const row = await this.prisma.videoLike.findUnique({
      where: {
        userId_videoId: {
          userId,
          videoId,
        },
      },
      select: { id: true },
    });
    return Boolean(row);
  }

  async toggleLike(videoId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const video = await tx.video.findFirst({
        where: { id: videoId, deletedAt: null },
        select: { id: true },
      });
      if (!video) throw new NotFoundException('Video not found');

      const existing = await tx.videoLike.findUnique({
        where: {
          userId_videoId: {
            userId,
            videoId,
          },
        },
        select: { id: true },
      });

      if (existing) {
        await tx.videoLike.delete({
          where: {
            userId_videoId: {
              userId,
              videoId,
            },
          },
        });
      } else {
        await tx.videoLike.create({
          data: {
            userId,
            videoId,
          },
        });
      }

      const likeCount = await tx.videoLike.count({
        where: { videoId },
      });

      return {
        liked: !existing,
        likeCount,
      };
    });
  }
}
