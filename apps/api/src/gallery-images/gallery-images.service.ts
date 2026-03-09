import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class GalleryImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly telegram: TelegramService,
  ) {}

  async uploadImages(params: {
    files: Express.Multer.File[];
    isPremium: boolean;
    uploaderId?: string;
  }) {
    const uploaded = await Promise.all(
      params.files.map(async (file) => {
        const caption = params.isPremium ? 'Gallery image (Premium)' : 'Gallery image (Free)';
        const result = await this.telegram.sendPhotoToChannel(file, caption);
        const fileId = result?.photo?.[result.photo.length - 1]?.file_id;
        if (!fileId) {
          throw new Error('Telegram upload failed');
        }

        return {
          telegramFileId: fileId,
          telegramMessageId: String(result.message_id),
          telegramChannelId: String(result.chat.id),
          isPremium: params.isPremium,
          uploaderId: params.uploaderId,
        };
      }),
    );

    const created = await this.prisma.$transaction(
      uploaded.map((item) =>
        this.prisma.galleryImage.create({
          data: item,
        }),
      ),
    );

    return {
      count: created.length,
      items: created,
    };
  }

  async list(params: { page: number; pageSize: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.galleryImage.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
      }),
      this.prisma.galleryImage.count(),
    ]);

    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize) || 1,
    };
  }

  async getById(id: string) {
    const image = await this.prisma.galleryImage.findUnique({ where: { id } });
    if (!image) throw new NotFoundException('Image not found');
    return image;
  }

  async getImageStream(id: string) {
    const image = await this.getById(id);
    const fileInfo = await this.telegram.getFile(image.telegramFileId);
    const response = await this.telegram.fetchFileStream(fileInfo.file_path);
    return response;
  }
}
