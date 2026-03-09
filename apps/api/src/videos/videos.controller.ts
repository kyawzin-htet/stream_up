import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { createReadStream, createWriteStream, mkdirSync } from 'fs';
import { promises as fs } from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { Response } from 'express';
import { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { VideosService } from './videos.service';
import { UploadVideoDto } from './dto/upload-video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { Public } from '../common/public.decorator';
import { UsersService } from '../users/users.service';
import { TelegramService } from '../telegram/telegram.service';

const CACHE_DIR = process.env.VIDEO_CACHE_DIR || path.join(os.tmpdir(), 'streamup-video-cache');
const CACHE_TTL_MS = Number(process.env.VIDEO_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
// Fix 6: Maximum total cache size in bytes (default 10 GB). Oldest files are evicted when exceeded.
const CACHE_MAX_BYTES = Number(process.env.VIDEO_CACHE_MAX_MB || 10240) * 1024 * 1024;
const CACHE_INFLIGHT = new Map<string, Promise<void>>();
const SOFT_MAX_MB = Number(process.env.UPLOAD_SOFT_MAX_MB || 500);
const HARD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 4096);
const MAX_DURATION_SEC = Number(process.env.UPLOAD_MAX_DURATION_SEC || 15 * 60);
const DEFAULT_GIF_DURATION_SEC = Number(process.env.UPLOAD_GIF_DEFAULT_DURATION_SEC || 6);
const MAX_GIF_DURATION_SEC = Number(process.env.UPLOAD_GIF_MAX_DURATION_SEC || 12);
const UPLOAD_INBOX_DIR = process.env.UPLOAD_INBOX_DIR || path.join(os.tmpdir(), 'streamup-upload-inbox');
const execFileAsync = promisify(execFile);

@Controller('videos')
export class VideosController {
  private readonly logger = new Logger(VideosController.name);

  constructor(
    private readonly videos: VideosService,
    private readonly users: UsersService,
    private readonly telegram: TelegramService,
  ) {}

  private cacheKey(fileId: string) {
    return Buffer.from(fileId).toString('base64url');
  }

  private cachePath(fileId: string) {
    return path.join(CACHE_DIR, `${this.cacheKey(fileId)}.bin`);
  }

  private async getCachedFile(fileId: string) {
    const filePath = this.cachePath(fileId);
    try {
      const stat = await fs.stat(filePath);
      if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) {
        await fs.unlink(filePath).catch(() => {});
        return null;
      }
      return { filePath, size: stat.size };
    } catch {
      return null;
    }
  }

  private async ensureCached(fileId: string, telegramFilePath: string) {
    if (CACHE_INFLIGHT.has(fileId)) return CACHE_INFLIGHT.get(fileId);
    const task = (async () => {
      await fs.mkdir(CACHE_DIR, { recursive: true });
      const filePath = this.cachePath(fileId);
      const tmpPath = `${filePath}.part`;
      try {
        await fs.access(filePath);
        return;
      } catch {
        // proceed to download
      }

      const response = await this.telegram.fetchFileStream(telegramFilePath);
      if (!response.ok || !response.body) {
        throw new Error('Failed to cache video');
      }

      const stream = Readable.fromWeb(response.body as any);
      await pipeline(stream, createWriteStream(tmpPath));
      await fs.rename(tmpPath, filePath);
      // Fix 6: Enforce LRU size cap after writing new file (fire-and-forget).
      void this.enforceCacheSizeLimit();
    })()
      .catch((error) => {
        this.logger.warn(`Video cache failed: ${String(error)}`);
      })
      .finally(() => {
        CACHE_INFLIGHT.delete(fileId);
      });

    CACHE_INFLIGHT.set(fileId, task);
    return task;
  }

  private async streamFromCache(res: Response, filePath: string, size: number) {
    const rangeHeader = res.req.headers.range as string | undefined;
    const contentType = 'video/mp4';
    res.setHeader('Accept-Ranges', 'bytes');

    if (!rangeHeader) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', size);
      res.status(200);
      createReadStream(filePath).pipe(res);
      return;
    }

    const match = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (!match) {
      res.status(416).setHeader('Content-Range', `bytes */${size}`);
      res.end();
      return;
    }

    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Number(match[2]) : size - 1;
    if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
      res.status(416).setHeader('Content-Range', `bytes */${size}`);
      res.end();
      return;
    }

    const safeEnd = Math.min(end, size - 1);
    res.status(206);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Range', `bytes ${start}-${safeEnd}/${size}`);
    res.setHeader('Content-Length', safeEnd - start + 1);
    createReadStream(filePath, { start, end: safeEnd }).pipe(res);
  }

  /**
   * Fix 6: LRU eviction — delete oldest cache files until total size is under CACHE_MAX_BYTES.
   * Called asynchronously after each new file is written to the cache.
   */
  private async enforceCacheSizeLimit() {
    try {
      const entries = await fs.readdir(CACHE_DIR);
      const stats = await Promise.all(
        entries.map(async (name) => {
          const filePath = path.join(CACHE_DIR, name);
          const stat = await fs.stat(filePath).catch(() => null);
          return stat ? { filePath, size: stat.size, mtime: stat.mtimeMs } : null;
        }),
      );
      const files = stats.filter(Boolean) as { filePath: string; size: number; mtime: number }[];
      // Sort oldest first
      files.sort((a, b) => a.mtime - b.mtime);
      let total = files.reduce((sum, f) => sum + f.size, 0);
      for (const file of files) {
        if (total <= CACHE_MAX_BYTES) break;
        await fs.unlink(file.filePath).catch(() => {});
        total -= file.size;
        this.logger.log(`Cache LRU: evicted ${file.filePath} (${Math.round(file.size / 1024 / 1024)}MB)`);
      }
    } catch {
      // Non-fatal — cache eviction failures should not interrupt serving
    }
  }

  private async warmCache(fileId: string) {
    try {
      const fileInfo = await this.telegram.getFile(fileId);
      await this.ensureCached(fileId, fileInfo.file_path);
    } catch (error) {
      this.logger.warn(`Warm cache failed for ${fileId}: ${String(error)}`);
    }
  }

  private async removeCachedFile(fileId: string) {
    const filePath = this.cachePath(fileId);
    CACHE_INFLIGHT.delete(fileId);
    await fs.unlink(filePath).catch(() => {});
  }

  private toClientVideo(video: any, likedByMe = false, favoritedByMe = false) {
    const likeCount = Number(video?._count?.likes || 0);
    const favoriteCount = Number(video?._count?.favorites || 0);
    return {
      ...video,
      likeCount,
      favoriteCount,
      likedByMe,
      favoritedByMe,
      _count: undefined,
      hasGif: Boolean(video.telegramGifFileId),
      telegramFileId: undefined,
      telegramMessageId: undefined,
      telegramChannelId: undefined,
      telegramGifFileId: undefined,
      telegramGifMessageId: undefined,
      telegramGifChannelId: undefined,
    };
  }

  private shouldClearGifMetadata(error: unknown) {
    const message = String((error as any)?.message || error).toLowerCase();
    return (
      message.includes('wrong file identifier') ||
      message.includes('file not found') ||
      message.includes('failed to get http url content')
    );
  }

  private inferPreviewMimeType(filePath: string) {
    const lower = String(filePath).toLowerCase();
    if (lower.endsWith('.gif')) return 'image/gif';
    if (lower.endsWith('.mp4')) return 'video/mp4';
    if (lower.endsWith('.webm')) return 'video/webm';
    return null;
  }

  /**
   * Fix 7: Premium access check via request.user set by OptionalJwtAuthGuard.
   * Eliminates manual JWT parsing — consistent with the rest of the auth system.
   */
  private async ensureViewerCanAccess(
    res: Response,
    isPremium: boolean,
    user: { id: string; email: string } | null,
  ) {
    if (!isPremium) return true;
    if (!user) {
      res.status(401).json({ message: 'Authentication required' });
      return false;
    }
    // Check Admin table first — admins bypass premium gate.
    const isAdmin = await this.users.isAdmin(user.id);
    if (isAdmin) return true;
    const dbUser = await this.users.findById(user.id);
    const active =
      dbUser.membershipType === 'PREMIUM' &&
      (!dbUser.membershipExpiresAt || dbUser.membershipExpiresAt.getTime() > Date.now());
    if (!active) {
      res.status(403).json({ message: 'Premium membership required' });
      return false;
    }
    return true;
  }

  private async ensurePremiumMember(userId: string) {
    const isAdmin = await this.users.isAdmin(userId);
    if (isAdmin) return true;
    const dbUser = await this.users.findById(userId);
    return (
      dbUser.membershipType === 'PREMIUM' &&
      (!dbUser.membershipExpiresAt || dbUser.membershipExpiresAt.getTime() > Date.now())
    );
  }

  private async getDurationSeconds(filePath: string) {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filePath,
    ]);
    const value = Number(String(stdout).trim());
    if (!Number.isFinite(value)) {
      throw new Error('Unable to read video duration');
    }
    return value;
  }

  private async processVideo({
    inputPath,
    outputPath,
    start,
    duration,
    transcode,
  }: {
    inputPath: string;
    outputPath: string;
    start: number;
    duration: number;
    transcode: boolean;
  }) {
    const args = ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(start), '-i', inputPath, '-t', String(duration)];
    if (transcode) {
      args.push(
        '-vf',
        "scale='min(1280,iw)':-2",
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '28',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart',
      );
    } else {
      args.push('-c', 'copy');
    }
    args.push(outputPath);
    await execFileAsync('ffmpeg', args);
  }

  private async createGif({
    inputPath,
    outputPath,
    start,
    duration,
  }: {
    inputPath: string;
    outputPath: string;
    start: number;
    duration: number;
  }) {
    const args = [
      '-y',
      '-hide_banner',
      '-loglevel',
      'error',
      '-ss',
      String(start),
      '-i',
      inputPath,
      '-t',
      String(duration),
      '-vf',
      "fps=12,scale='min(480,iw)':-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=5",
      '-loop',
      '0',
      outputPath,
    ];
    await execFileAsync('ffmpeg', args);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get()
  async list(
    @Query('query') query?: string,
    @Query('category') category?: string,
    @Query('sort') sort?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
    @CurrentUser() user?: { id: string } | null,
  ) {
    const normalizedSort = sort === 'popular' ? 'popular' : 'latest';
    const data = await this.videos.listVideos({
      query,
      category,
      sort: normalizedSort,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(pageSize) || 12)),
    });
    const videoIds = data.items.map((video) => video.id);
    const [likedIds, favoritedIds] = user
      ? await Promise.all([
          this.videos.getLikedVideoIds(user.id, videoIds).then((ids) => new Set(ids)),
          this.videos.getFavoritedVideoIds(user.id, videoIds).then((ids) => new Set(ids)),
        ])
      : [new Set<string>(), new Set<string>()];

    return {
      ...data,
      items: data.items.map((video) =>
        this.toClientVideo(video, likedIds.has(video.id), favoritedIds.has(video.id)),
      ),
    };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin')
  async adminList(
    @Query('status') status: 'active' | 'trashed' = 'active',
    @Query('query') query?: string,
    @Query('premium') premium?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const normalizedPage = Math.max(1, Number(page) || 1);
    const normalizedSize = Math.min(50, Math.max(1, Number(pageSize) || 20));

    if (status === 'trashed') {
      const data = await this.videos.listDeletedVideos({
        page: normalizedPage,
        pageSize: normalizedSize,
        query,
      });
      return {
        ...data,
        items: data.items.map((video) => this.toClientVideo(video)),
      };
    }

    const premiumFilter =
      premium === 'true' ? true : premium === 'false' ? false : null;

    const data = await this.videos.listVideos({
      query,
      premium: premiumFilter,
      page: normalizedPage,
      pageSize: normalizedSize,
    });
    return {
      ...data,
      items: data.items.map((video) => this.toClientVideo(video)),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites')
  async listFavorites(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '12',
    @CurrentUser() user: { id: string },
  ) {
    if (!(await this.ensurePremiumMember(user.id))) {
      throw new ForbiddenException('Premium membership required');
    }

    const data = await this.videos.listFavoriteVideos({
      userId: user.id,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(pageSize) || 12)),
    });
    const likedIds = new Set(await this.videos.getLikedVideoIds(user.id, data.items.map((video) => video.id)));

    return {
      ...data,
      items: data.items.map((video) => this.toClientVideo(video, likedIds.has(video.id), true)),
    };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id')
  async get(
    @Param('id') id: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    const video = await this.videos.getVideo(id);
    const [likedByMe, favoritedByMe] = user
      ? await Promise.all([
          this.videos.isVideoLikedByUser(id, user.id),
          this.videos.isVideoFavoritedByUser(id, user.id),
        ])
      : [false, false];
    return this.toClientVideo(video, likedByMe, favoritedByMe);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id/like')
  async getLikeStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    const video = await this.videos.getVideo(id);
    const likeCount = Number(video?._count?.likes || 0);
    const liked = user ? await this.videos.isVideoLikedByUser(id, user.id) : false;
    return { liked, likeCount };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id/favorite')
  async getFavoriteStatus(
    @Param('id') id: string,
    @CurrentUser() user: { id: string } | null,
  ) {
    const video = await this.videos.getVideo(id);
    const favoriteCount = Number(video?._count?.favorites || 0);
    const favorited = user ? await this.videos.isVideoFavoritedByUser(id, user.id) : false;
    return { favorited, favoriteCount };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/like')
  async toggleLike(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    return this.videos.toggleLike(id, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/favorite')
  async toggleFavorite(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
  ) {
    if (!(await this.ensurePremiumMember(user.id))) {
      throw new ForbiddenException('Premium membership required');
    }
    return this.videos.toggleFavorite(id, user.id);
  }

  @Public()
  @Post(':id/watch')
  async incrementWatch(@Param('id') id: string) {
    const watchCount = await this.videos.incrementWatchCount(id);
    return { watchCount };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          try {
            mkdirSync(UPLOAD_INBOX_DIR, { recursive: true });
            cb(null, UPLOAD_INBOX_DIR);
          } catch (error) {
            cb(error as any, UPLOAD_INBOX_DIR);
          }
        },
        filename: (_req, file, cb) => {
          const ext = path.extname(file.originalname || '').toLowerCase();
          const safeExt = ext && /^[.a-z0-9]+$/.test(ext) ? ext : '.mp4';
          cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${safeExt}`);
        },
      }),
      limits: { fileSize: HARD_MAX_MB * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('video/')) {
          cb(new BadRequestException('Only video uploads are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadVideoDto,
    @CurrentUser() user: { id: string },
  ) {
    if (!file?.path) throw new BadRequestException('Missing file');

    const keywords = dto.keywords
      ? dto.keywords.split(',').map((k) => k.trim()).filter(Boolean)
      : [];

    const allowTranscode = dto.allowTranscode === 'true';
    const trimStart = Number(dto.trimStart || 0);
    const trimEnd = dto.trimEnd ? Number(dto.trimEnd) : undefined;
    const fileSizeMb = file.size / (1024 * 1024);
    const needsTranscode = fileSizeMb > SOFT_MAX_MB;

    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'streamup-upload-'));
    const inputPath = file.path;
    const outputPath = path.join(tmpDir, 'output.mp4');
    const gifPath = path.join(tmpDir, 'preview.gif');
    let processedFile: Express.Multer.File | null = null;
    let gifFile: Express.Multer.File | null = null;

    try {
      const durationSec = await this.getDurationSeconds(inputPath);
      let start = Number.isFinite(trimStart) ? Math.max(0, trimStart) : 0;
      let end = Number.isFinite(trimEnd || NaN) ? Math.max(start + 1, trimEnd as number) : durationSec;

      if (durationSec > MAX_DURATION_SEC) {
        if (!Number.isFinite(trimEnd || NaN)) {
          end = Math.min(durationSec, start + MAX_DURATION_SEC);
        } else {
          end = Math.min(end, start + MAX_DURATION_SEC, durationSec);
        }
      } else {
        end = Math.min(end, durationSec);
      }

      const needsTrim =
        durationSec > MAX_DURATION_SEC || start > 0 || end < durationSec - 0.5;
      const clipDuration = Math.max(1, end - start);
      const hasLengthReduction = clipDuration < durationSec - 0.5 || start > 0;
      if (needsTranscode && !allowTranscode && !hasLengthReduction) {
        throw new BadRequestException(
          `File size ${fileSizeMb.toFixed(1)}MB exceeds ${SOFT_MAX_MB}MB. Enable quality reduction or trim a shorter segment.`,
        );
      }

      let finalPath = inputPath;
      let finalName = file.originalname;
      let finalMime = file.mimetype || 'video/mp4';
      let sourceDurationSec = durationSec;
      if (needsTrim || (needsTranscode && allowTranscode)) {
        await this.processVideo({
          inputPath,
          outputPath,
          start,
          duration: clipDuration,
          transcode: needsTranscode && allowTranscode,
        });
        finalPath = outputPath;
        finalName = file.originalname.replace(/\.[^/.]+$/, '.mp4');
        finalMime = 'video/mp4';
        sourceDurationSec = clipDuration;
      }

      const buffer = await fs.readFile(finalPath);
      processedFile = {
        ...file,
        buffer,
        size: buffer.length,
        mimetype: finalMime,
        originalname: finalName,
      };

      const gifStart = 0;
      const gifDuration = Math.max(
        0.5,
        Math.min(sourceDurationSec - gifStart, MAX_GIF_DURATION_SEC, DEFAULT_GIF_DURATION_SEC),
      );
      await this.createGif({
        inputPath: finalPath,
        outputPath: gifPath,
        start: gifStart,
        duration: gifDuration,
      });
      const gifBuffer = await fs.readFile(gifPath);
      gifFile = {
        ...processedFile,
        buffer: gifBuffer,
        size: gifBuffer.length,
        mimetype: 'image/gif',
        originalname: processedFile.originalname.replace(/\.[^/.]+$/, '.gif'),
      };
    } catch (error: any) {
      const message = String(error?.message || error);
      if (message.includes('ffprobe') || message.includes('ffmpeg')) {
        throw new BadRequestException('Video processing failed. Ensure ffmpeg/ffprobe are installed.');
      }
      throw error;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      await fs.unlink(file.path).catch(() => {});
    }

    if (!processedFile || !gifFile) throw new BadRequestException('Failed to prepare video file');

    const created = await this.videos.createVideo({
      file: processedFile,
      gifFile,
      title: dto.title,
      description: dto.description,
      categoryId: dto.categoryId,
      keywords,
      isPremium: dto.isPremium === 'true',
      uploaderId: user.id,
    });

    void this.warmCache(created.telegramFileId);
    return created;
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/trash')
  async moveToTrash(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    const deleted = await this.videos.softDeleteVideo(id, user.id);
    return { id: deleted.id };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/restore')
  async restore(@Param('id') id: string) {
    const restored = await this.videos.restoreVideo(id);
    return { id: restored.id };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    const deleted = await this.videos.getVideoIncludingDeleted(id);
    await this.videos.deleteVideo(id);
    await this.removeCachedFile(deleted.telegramFileId);
    try {
      await this.telegram.deleteMessage(deleted.telegramChannelId, deleted.telegramMessageId);
    } catch (error) {
      this.logger.warn(`Telegram deleteMessage failed for ${id}: ${String(error)}`);
    }
    return { id: deleted.id };
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id/stream')
  async stream(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: { id: string; email: string } | null,
  ) {
    const video = await this.videos.getVideo(id);
    if (!(await this.ensureViewerCanAccess(res, video.isPremium, user))) return;

    const cached = await this.getCachedFile(video.telegramFileId);
    if (cached) {
      await this.streamFromCache(res, cached.filePath, cached.size);
      return;
    }

    const fileInfo = await this.telegram.getFile(video.telegramFileId);
    void this.ensureCached(video.telegramFileId, fileInfo.file_path);
    const range = res.req.headers.range as string | undefined;
    // Proxy the Telegram file stream so clients never see the Telegram file URL.
    const fileResponse = await this.telegram.fetchFileStream(fileInfo.file_path, range);

    if (!fileResponse.ok || !fileResponse.body) {
      res.status(502).json({ message: 'Failed to stream video' });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': fileResponse.headers.get('content-type') || 'video/mp4',
      'Content-Length': fileResponse.headers.get('content-length') || '',
    };

    const contentRange = fileResponse.headers.get('content-range');
    if (contentRange) headers['Content-Range'] = contentRange;
    const acceptRanges = fileResponse.headers.get('accept-ranges');
    if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;

    const status = fileResponse.status;
    res.status(status);
    Object.entries(headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });

    const bodyStream = fileResponse.body as ReadableStream | null;
    const cancelUpstream = () => {
      if (!bodyStream) return;
      try {
        if ('locked' in bodyStream && (bodyStream as any).locked) return;
        const result = bodyStream.cancel();
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {}
    };

    const stream = Readable.fromWeb(fileResponse.body as any);
    stream.on('error', (error) => {
      this.logger.warn(`Stream error for video ${id}: ${String(error)}`);
      if (!res.headersSent) res.status(499);
      res.end();
    });
    res.on('close', () => {
      cancelUpstream();
      stream.destroy();
    });
    stream.pipe(res);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Public()
  @Get(':id/preview')
  async preview(
    @Param('id') id: string,
    @Res() res: Response,
    @CurrentUser() user: { id: string; email: string } | null,
  ) {
    const video = await this.videos.getVideo(id);
    if (!(await this.ensureViewerCanAccess(res, video.isPremium, user))) return;
    const fileInfo = await this.telegram.getFile(video.telegramFileId);
    const range = res.req.headers.range as string | undefined;
    const fileResponse = await this.telegram.fetchFileStream(fileInfo.file_path, range);

    if (!fileResponse.ok || !fileResponse.body) {
      res.status(502).json({ message: 'Failed to stream preview' });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': fileResponse.headers.get('content-type') || 'video/mp4',
      'Content-Length': fileResponse.headers.get('content-length') || '',
    };

    const contentRange = fileResponse.headers.get('content-range');
    if (contentRange) headers['Content-Range'] = contentRange;
    const acceptRanges = fileResponse.headers.get('accept-ranges');
    if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;

    const status = fileResponse.status;
    res.status(status);
    Object.entries(headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });

    const bodyStream = fileResponse.body as ReadableStream | null;
    const cancelUpstream = () => {
      if (!bodyStream) return;
      try {
        if ('locked' in bodyStream && (bodyStream as any).locked) return;
        const result = bodyStream.cancel();
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {}
    };

    const stream = Readable.fromWeb(fileResponse.body as any);
    stream.on('error', (error) => {
      this.logger.warn(`Preview stream error for video ${id}: ${String(error)}`);
      if (!res.headersSent) res.status(499);
      res.end();
    });
    res.on('close', () => {
      cancelUpstream();
      stream.destroy();
    });
    stream.pipe(res);
  }

  @Public()
  @Get(':id/gif')
  async gif(@Param('id') id: string, @Res() res: Response) {
    const video = await this.videos.getVideo(id);
    if (!video.telegramGifFileId) {
      res.status(404).json({ message: 'GIF preview not available' });
      return;
    }

    let fileInfo: { file_path: string; file_size?: number };
    try {
      fileInfo = await this.telegram.getFile(video.telegramGifFileId);
    } catch (error) {
      this.logger.warn(`GIF getFile failed for video ${id}: ${String(error)}`);
      if (this.shouldClearGifMetadata(error)) {
        await this.videos.clearGifMetadata(id).catch((clearError) => {
          this.logger.warn(`Failed to clear GIF metadata for video ${id}: ${String(clearError)}`);
        });
      }
      res.status(404).json({ message: 'GIF preview not available' });
      return;
    }

    let fileResponse: globalThis.Response;
    try {
      fileResponse = await this.telegram.fetchFileStream(fileInfo.file_path);
    } catch (error) {
      this.logger.warn(`GIF fetch stream failed for video ${id}: ${String(error)}`);
      res.status(502).json({ message: 'Failed to stream GIF preview' });
      return;
    }

    if (!fileResponse.ok || !fileResponse.body) {
      res.status(502).json({ message: 'Failed to stream GIF preview' });
      return;
    }

    const upstreamType = fileResponse.headers.get('content-type');
    const inferredType = this.inferPreviewMimeType(fileInfo.file_path);
    const contentType =
      upstreamType && upstreamType !== 'application/octet-stream'
        ? upstreamType
        : inferredType || upstreamType || 'application/octet-stream';

    const headers: Record<string, string> = {
      'Content-Type': contentType,
      'Content-Length': fileResponse.headers.get('content-length') || '',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': 'inline',
      ETag: `W/"preview-${video.telegramGifFileId}"`,
    };

    const status = fileResponse.status;
    res.status(status);
    Object.entries(headers).forEach(([key, value]) => {
      if (value) res.setHeader(key, value);
    });

    const bodyStream = fileResponse.body as ReadableStream | null;
    const cancelUpstream = () => {
      if (!bodyStream) return;
      try {
        if ('locked' in bodyStream && (bodyStream as any).locked) return;
        const result = bodyStream.cancel();
        if (result && typeof (result as Promise<void>).catch === 'function') {
          (result as Promise<void>).catch(() => {});
        }
      } catch {}
    };

    const stream = Readable.fromWeb(fileResponse.body as any);
    stream.on('error', (error) => {
      this.logger.warn(`GIF stream error for video ${id}: ${String(error)}`);
      if (!res.headersSent) res.status(499);
      res.end();
    });
    res.on('close', () => {
      cancelUpstream();
      stream.destroy();
    });
    stream.pipe(res);
  }
}
