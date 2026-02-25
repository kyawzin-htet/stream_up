"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var VideosController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideosController = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const fs_1 = require("fs");
const fs_2 = require("fs");
const os = require("os");
const path = require("path");
const child_process_1 = require("child_process");
const util_1 = require("util");
const stream_1 = require("stream");
const promises_1 = require("stream/promises");
const videos_service_1 = require("./videos.service");
const upload_video_dto_1 = require("./dto/upload-video.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const admin_guard_1 = require("../common/admin.guard");
const current_user_decorator_1 = require("../common/current-user.decorator");
const public_decorator_1 = require("../common/public.decorator");
const users_service_1 = require("../users/users.service");
const telegram_service_1 = require("../telegram/telegram.service");
const CACHE_DIR = process.env.VIDEO_CACHE_DIR || path.join(os.tmpdir(), 'streamup-video-cache');
const CACHE_TTL_MS = Number(process.env.VIDEO_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const CACHE_INFLIGHT = new Map();
const SOFT_MAX_MB = Number(process.env.UPLOAD_SOFT_MAX_MB || 500);
const HARD_MAX_MB = Number(process.env.UPLOAD_MAX_MB || 1024);
const MAX_DURATION_SEC = Number(process.env.UPLOAD_MAX_DURATION_SEC || 15 * 60);
const DEFAULT_GIF_DURATION_SEC = Number(process.env.UPLOAD_GIF_DEFAULT_DURATION_SEC || 6);
const MAX_GIF_DURATION_SEC = Number(process.env.UPLOAD_GIF_MAX_DURATION_SEC || 12);
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
let VideosController = VideosController_1 = class VideosController {
    constructor(videos, users, telegram, jwt) {
        this.videos = videos;
        this.users = users;
        this.telegram = telegram;
        this.jwt = jwt;
        this.logger = new common_1.Logger(VideosController_1.name);
    }
    cacheKey(fileId) {
        return Buffer.from(fileId).toString('base64url');
    }
    cachePath(fileId) {
        return path.join(CACHE_DIR, `${this.cacheKey(fileId)}.bin`);
    }
    async getCachedFile(fileId) {
        const filePath = this.cachePath(fileId);
        try {
            const stat = await fs_2.promises.stat(filePath);
            if (Date.now() - stat.mtimeMs > CACHE_TTL_MS) {
                await fs_2.promises.unlink(filePath).catch(() => { });
                return null;
            }
            return { filePath, size: stat.size };
        }
        catch {
            return null;
        }
    }
    async ensureCached(fileId, telegramFilePath) {
        if (CACHE_INFLIGHT.has(fileId))
            return CACHE_INFLIGHT.get(fileId);
        const task = (async () => {
            await fs_2.promises.mkdir(CACHE_DIR, { recursive: true });
            const filePath = this.cachePath(fileId);
            const tmpPath = `${filePath}.part`;
            try {
                await fs_2.promises.access(filePath);
                return;
            }
            catch {
            }
            const response = await this.telegram.fetchFileStream(telegramFilePath);
            if (!response.ok || !response.body) {
                throw new Error('Failed to cache video');
            }
            const stream = stream_1.Readable.fromWeb(response.body);
            await (0, promises_1.pipeline)(stream, (0, fs_1.createWriteStream)(tmpPath));
            await fs_2.promises.rename(tmpPath, filePath);
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
    async streamFromCache(res, filePath, size) {
        const rangeHeader = res.req.headers.range;
        const contentType = 'video/mp4';
        res.setHeader('Accept-Ranges', 'bytes');
        if (!rangeHeader) {
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', size);
            res.status(200);
            (0, fs_1.createReadStream)(filePath).pipe(res);
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
        (0, fs_1.createReadStream)(filePath, { start, end: safeEnd }).pipe(res);
    }
    async warmCache(fileId) {
        try {
            const fileInfo = await this.telegram.getFile(fileId);
            await this.ensureCached(fileId, fileInfo.file_path);
        }
        catch (error) {
            this.logger.warn(`Warm cache failed for ${fileId}: ${String(error)}`);
        }
    }
    async removeCachedFile(fileId) {
        const filePath = this.cachePath(fileId);
        CACHE_INFLIGHT.delete(fileId);
        await fs_2.promises.unlink(filePath).catch(() => { });
    }
    async getDurationSeconds(filePath) {
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
    async processVideo({ inputPath, outputPath, start, duration, transcode, }) {
        const args = ['-y', '-hide_banner', '-loglevel', 'error', '-ss', String(start), '-i', inputPath, '-t', String(duration)];
        if (transcode) {
            args.push('-vf', "scale='min(1280,iw)':-2", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart');
        }
        else {
            args.push('-c', 'copy');
        }
        args.push(outputPath);
        await execFileAsync('ffmpeg', args);
    }
    async createGif({ inputPath, outputPath, start, duration, }) {
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
    async ensureViewerCanAccess(res, isPremium) {
        if (!isPremium)
            return true;
        const authHeader = res.req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) {
            res.status(401).json({ message: 'Authentication required' });
            return false;
        }
        try {
            const payload = await this.jwt.verifyAsync(token);
            if (!payload?.sub) {
                res.status(401).json({ message: 'Invalid token' });
                return false;
            }
            const viewer = await this.users.findById(payload.sub);
            const active = viewer.membershipType === 'PREMIUM' &&
                (!viewer.membershipExpiresAt || viewer.membershipExpiresAt.getTime() > Date.now());
            if (!active) {
                res.status(403).json({ message: 'Premium membership required' });
                return false;
            }
            return true;
        }
        catch {
            res.status(401).json({ message: 'Invalid token' });
            return false;
        }
    }
    async proxyTelegramFile({ res, fileId, telegramFilePath, defaultContentType, errorMessage, allowRange = false, }) {
        const filePath = telegramFilePath || (await this.telegram.getFile(fileId)).file_path;
        const range = allowRange ? (res.req.headers.range || undefined) : undefined;
        const fileResponse = await this.telegram.fetchFileStream(filePath, range);
        if (!fileResponse.ok || !fileResponse.body) {
            res.status(502).json({ message: errorMessage });
            return;
        }
        const headers = {
            'Content-Type': fileResponse.headers.get('content-type') || defaultContentType,
            'Content-Length': fileResponse.headers.get('content-length') || '',
        };
        const contentRange = fileResponse.headers.get('content-range');
        if (contentRange)
            headers['Content-Range'] = contentRange;
        const acceptRanges = fileResponse.headers.get('accept-ranges');
        if (acceptRanges)
            headers['Accept-Ranges'] = acceptRanges;
        res.status(fileResponse.status);
        Object.entries(headers).forEach(([key, value]) => {
            if (value)
                res.setHeader(key, value);
        });
        const bodyStream = fileResponse.body;
        const cancelUpstream = () => {
            if (!bodyStream)
                return;
            try {
                if ('locked' in bodyStream && bodyStream.locked)
                    return;
                const result = bodyStream.cancel();
                if (result && typeof result.catch === 'function') {
                    result.catch(() => { });
                }
            }
            catch { }
        };
        const stream = stream_1.Readable.fromWeb(fileResponse.body);
        stream.on('error', (error) => {
            this.logger.warn(`${errorMessage} (${fileId}): ${String(error)}`);
            if (!res.headersSent)
                res.status(499);
            res.end();
        });
        res.on('close', () => {
            cancelUpstream();
            stream.destroy();
        });
        stream.pipe(res);
    }
    setStreamCacheHeaders(res, isPremium) {
        res.setHeader('Cache-Control', isPremium
            ? 'private, max-age=600, stale-while-revalidate=3600'
            : 'public, max-age=600, stale-while-revalidate=3600');
        res.setHeader('Vary', 'Authorization, Range');
    }
    toClientVideo(video) {
        return {
            ...video,
            hasGif: Boolean(video.telegramGifFileId),
            telegramFileId: undefined,
            telegramMessageId: undefined,
            telegramChannelId: undefined,
            telegramGifFileId: undefined,
            telegramGifMessageId: undefined,
            telegramGifChannelId: undefined,
        };
    }
    async list(query, category, page = '1', pageSize = '12') {
        const data = await this.videos.listVideos({
            query,
            category,
            page: Math.max(1, Number(page) || 1),
            pageSize: Math.min(50, Math.max(1, Number(pageSize) || 12)),
        });
        return {
            ...data,
            items: data.items.map((video) => this.toClientVideo(video)),
        };
    }
    async adminList(status = 'active', query, premium, page = '1', pageSize = '20') {
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
        const premiumFilter = premium === 'true' ? true : premium === 'false' ? false : null;
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
    async get(id) {
        const video = await this.videos.getVideo(id);
        return this.toClientVideo(video);
    }
    async upload(file, dto, user) {
        if (!file)
            throw new common_1.BadRequestException('Missing file');
        const keywords = dto.keywords
            ? dto.keywords.split(',').map((k) => k.trim()).filter(Boolean)
            : [];
        const allowTranscode = dto.allowTranscode === 'true';
        const trimStart = Number(dto.trimStart || 0);
        const trimEnd = dto.trimEnd ? Number(dto.trimEnd) : undefined;
        const gifStartInput = dto.gifStart ? Number(dto.gifStart) : 0;
        const gifEndInput = dto.gifEnd ? Number(dto.gifEnd) : undefined;
        const fileSizeMb = file.size / (1024 * 1024);
        const needsTranscode = fileSizeMb > SOFT_MAX_MB;
        if (needsTranscode && !allowTranscode) {
            throw new common_1.BadRequestException(`File size ${fileSizeMb.toFixed(1)}MB exceeds ${SOFT_MAX_MB}MB. Enable quality reduction to continue.`);
        }
        const tmpDir = await fs_2.promises.mkdtemp(path.join(os.tmpdir(), 'streamup-upload-'));
        const inputPath = path.join(tmpDir, file.originalname.replace(/\s+/g, '_'));
        const outputPath = path.join(tmpDir, 'output.mp4');
        const gifPath = path.join(tmpDir, 'preview.gif');
        let processedFile = file;
        let gifFile = null;
        try {
            await fs_2.promises.writeFile(inputPath, file.buffer);
            const durationSec = await this.getDurationSeconds(inputPath);
            let start = Number.isFinite(trimStart) ? Math.max(0, trimStart) : 0;
            let end = Number.isFinite(trimEnd || NaN) ? Math.max(start + 1, trimEnd) : durationSec;
            if (durationSec > MAX_DURATION_SEC) {
                if (!Number.isFinite(trimEnd || NaN)) {
                    end = Math.min(durationSec, start + MAX_DURATION_SEC);
                }
                else {
                    end = Math.min(end, start + MAX_DURATION_SEC, durationSec);
                }
            }
            else {
                end = Math.min(end, durationSec);
            }
            const needsTrim = durationSec > MAX_DURATION_SEC || (Number.isFinite(trimEnd || NaN) && end > start);
            let sourceForGifPath = inputPath;
            let sourceDurationSec = durationSec;
            if (needsTrim || needsTranscode) {
                const clipDuration = Math.max(1, end - start);
                await this.processVideo({
                    inputPath,
                    outputPath,
                    start,
                    duration: clipDuration,
                    transcode: needsTranscode,
                });
                const buffer = await fs_2.promises.readFile(outputPath);
                processedFile = {
                    ...file,
                    buffer,
                    size: buffer.length,
                    mimetype: 'video/mp4',
                    originalname: file.originalname.replace(/\.[^/.]+$/, '.mp4'),
                };
                sourceForGifPath = outputPath;
                sourceDurationSec = clipDuration;
            }
            const safeGifStart = Number.isFinite(gifStartInput) ? Math.max(0, gifStartInput) : 0;
            const normalizedGifStart = Math.min(Math.max(sourceDurationSec - 0.5, 0), safeGifStart);
            const desiredGifEnd = Number.isFinite(gifEndInput || NaN)
                ? Math.max(normalizedGifStart + 0.5, gifEndInput)
                : Math.min(sourceDurationSec, normalizedGifStart + DEFAULT_GIF_DURATION_SEC);
            const normalizedGifEnd = Math.min(sourceDurationSec, normalizedGifStart + MAX_GIF_DURATION_SEC, desiredGifEnd);
            const gifDuration = Math.max(0.5, normalizedGifEnd - normalizedGifStart);
            await this.createGif({
                inputPath: sourceForGifPath,
                outputPath: gifPath,
                start: normalizedGifStart,
                duration: gifDuration,
            });
            const gifBuffer = await fs_2.promises.readFile(gifPath);
            gifFile = {
                ...processedFile,
                buffer: gifBuffer,
                size: gifBuffer.length,
                mimetype: 'image/gif',
                originalname: processedFile.originalname.replace(/\.[^/.]+$/, '.gif'),
            };
        }
        catch (error) {
            const message = String(error?.message || error);
            if (message.includes('ffprobe') || message.includes('ffmpeg')) {
                throw new common_1.BadRequestException('Video processing failed. Ensure ffmpeg/ffprobe are installed.');
            }
            throw error;
        }
        finally {
            await fs_2.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => { });
        }
        if (!gifFile) {
            throw new common_1.BadRequestException('Failed to generate GIF preview');
        }
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
    async moveToTrash(id, user) {
        const deleted = await this.videos.softDeleteVideo(id, user.id);
        return { id: deleted.id };
    }
    async restore(id) {
        const restored = await this.videos.restoreVideo(id);
        return { id: restored.id };
    }
    async remove(id) {
        const deleted = await this.videos.getVideoIncludingDeleted(id);
        await this.videos.deleteVideo(id);
        await this.removeCachedFile(deleted.telegramFileId);
        try {
            await this.telegram.deleteMessage(deleted.telegramChannelId, deleted.telegramMessageId);
        }
        catch (error) {
            this.logger.warn(`Telegram deleteMessage failed for ${id}: ${String(error)}`);
        }
        if (deleted.telegramGifChannelId && deleted.telegramGifMessageId) {
            try {
                await this.telegram.deleteMessage(deleted.telegramGifChannelId, deleted.telegramGifMessageId);
            }
            catch (error) {
                this.logger.warn(`Telegram GIF deleteMessage failed for ${id}: ${String(error)}`);
            }
        }
        return { id: deleted.id };
    }
    async stream(id, res) {
        const video = await this.videos.getVideo(id);
        if (!(await this.ensureViewerCanAccess(res, video.isPremium)))
            return;
        this.setStreamCacheHeaders(res, video.isPremium);
        const cached = await this.getCachedFile(video.telegramFileId);
        if (cached) {
            await this.streamFromCache(res, cached.filePath, cached.size);
            return;
        }
        const fileInfo = await this.telegram.getFile(video.telegramFileId);
        void this.ensureCached(video.telegramFileId, fileInfo.file_path);
        await this.proxyTelegramFile({
            res,
            fileId: video.telegramFileId,
            telegramFilePath: fileInfo.file_path,
            defaultContentType: 'video/mp4',
            errorMessage: 'Failed to stream video',
            allowRange: true,
        });
    }
    async preview(id, res) {
        const video = await this.videos.getVideo(id);
        if (!(await this.ensureViewerCanAccess(res, video.isPremium)))
            return;
        this.setStreamCacheHeaders(res, video.isPremium);
        await this.proxyTelegramFile({
            res,
            fileId: video.telegramFileId,
            defaultContentType: 'video/mp4',
            errorMessage: 'Failed to stream preview',
            allowRange: true,
        });
    }
    async gif(id, res) {
        const video = await this.videos.getVideo(id);
        if (!(await this.ensureViewerCanAccess(res, video.isPremium)))
            return;
        if (!video.telegramGifFileId) {
            res.status(404).json({ message: 'GIF preview not available' });
            return;
        }
        this.setStreamCacheHeaders(res, video.isPremium);
        await this.proxyTelegramFile({
            res,
            fileId: video.telegramGifFileId,
            defaultContentType: 'image/gif',
            errorMessage: 'Failed to stream GIF preview',
            allowRange: false,
        });
    }
};
exports.VideosController = VideosController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('query')),
    __param(1, (0, common_1.Query)('category')),
    __param(2, (0, common_1.Query)('page')),
    __param(3, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "list", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Get)('admin'),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('query')),
    __param(2, (0, common_1.Query)('premium')),
    __param(3, (0, common_1.Query)('page')),
    __param(4, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "adminList", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "get", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: HARD_MAX_MB * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (!file.mimetype.startsWith('video/')) {
                cb(new common_1.BadRequestException('Only video uploads are allowed'), false);
                return;
            }
            cb(null, true);
        },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, upload_video_dto_1.UploadVideoDto, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "upload", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Patch)(':id/trash'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "moveToTrash", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Patch)(':id/restore'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "restore", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, admin_guard_1.AdminGuard),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "remove", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/stream'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "stream", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "preview", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)(':id/gif'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideosController.prototype, "gif", null);
exports.VideosController = VideosController = VideosController_1 = __decorate([
    (0, common_1.Controller)('videos'),
    __metadata("design:paramtypes", [videos_service_1.VideosService,
        users_service_1.UsersService,
        telegram_service_1.TelegramService,
        jwt_1.JwtService])
], VideosController);
//# sourceMappingURL=videos.controller.js.map