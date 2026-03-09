import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { GalleryImagesService } from './gallery-images.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';

@Controller('gallery-images')
export class GalleryImagesController {
  constructor(private readonly gallery: GalleryImagesService) {}

  private parseTags(raw: unknown) {
    if (Array.isArray(raw)) {
      return raw
        .flatMap((value) => String(value).split(','))
        .map((value) => value.trim())
        .filter(Boolean);
    }

    return String(raw || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get()
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '24',
    @Query('query') query = '',
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.gallery.list({
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(100, Math.max(1, Number(pageSize) || 24)),
      query,
      userId: user?.id,
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UseInterceptors(
    FilesInterceptor('files', 20, {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new BadRequestException('Only image uploads are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('isPremium') isPremiumRaw: string | undefined,
    @Body('title') titleRaw: string | undefined,
    @Body('tags') tagsRaw: string | string[] | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!files?.length) throw new BadRequestException('Missing file');

    const title = (titleRaw || '').trim();
    const tags = this.parseTags(tagsRaw);
    if (!title && tags.length === 0) {
      throw new BadRequestException('Title or tags are required');
    }

    const isPremium = isPremiumRaw === 'true';

    return this.gallery.uploadImages({
      files,
      isPremium,
      title,
      tags,
      uploaderId: user.id,
    });
  }

  @Public()
  @Get(':id/file')
  async streamImage(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const response = await this.gallery.getImageStream(id);
    const body = await response.arrayBuffer();

    const headers = new Headers();
    const passthrough = [
      'content-type',
      'cache-control',
      'content-disposition',
      'etag',
      'last-modified',
      'vary',
    ];

    passthrough.forEach((key) => {
      const value = response.headers.get(key);
      if (value) headers.set(key, value);
    });
    headers.set('content-length', String(body.byteLength));

    res.status(response.status);
    headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.send(Buffer.from(body));
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id/like')
  async getLikeStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.gallery.getLikeStatus(id, user?.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.gallery.toggleLike(id, user.id);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id')
  async get(
    @Param('id') id: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    return this.gallery.getGroupById(id, user?.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.gallery.deleteGroup(id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('bulk-delete')
  async bulkRemove(@Body('ids') idsRaw: string[] | undefined) {
    const ids = Array.isArray(idsRaw)
      ? idsRaw.map((id) => String(id || '').trim()).filter(Boolean)
      : [];

    if (!ids.length) {
      throw new BadRequestException('Missing image group ids');
    }

    return this.gallery.deleteGroups(ids);
  }
}
