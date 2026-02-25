import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private isAdmin(email?: string | null) {
    if (!email) return false;
    const raw = this.config.get<string>('ADMIN_EMAILS') || '';
    const admins = raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);
    return admins.includes(String(email).toLowerCase());
  }

  private async ensureCanComment(userId: string) {
    const user = await this.users.findById(userId);
    if (this.isAdmin(user.email)) return;

    const active =
      user.membershipType === 'PREMIUM' &&
      (!user.membershipExpiresAt || user.membershipExpiresAt.getTime() > Date.now());
    if (!active) {
      throw new ForbiddenException('Premium membership required to comment');
    }
  }

  async listByVideo(videoId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, deletedAt: null },
      select: { id: true },
    });
    if (!video) throw new NotFoundException('Video not found');

    return this.prisma.comment.findMany({
      where: { videoId, parentId: null },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { user: { select: { id: true, email: true } } },
        },
      },
    });
  }

  async createComment(params: {
    videoId?: string;
    userId: string;
    body: string;
    parentId?: string;
  }) {
    if (!params.body.trim()) throw new BadRequestException('Comment is empty');
    await this.ensureCanComment(params.userId);

    let videoId = params.videoId;
    let parentId: string | null = null;
    if (params.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: params.parentId },
        select: { id: true, parentId: true, videoId: true },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.parentId) {
        throw new BadRequestException('Replies can only be one level deep');
      }
      if (videoId && parent.videoId !== videoId) {
        throw new BadRequestException('Parent comment does not match video');
      }
      parentId = parent.id;
      videoId = parent.videoId;
    }

    if (!videoId) throw new BadRequestException('Missing video');
    const video = await this.prisma.video.findFirst({
      where: { id: videoId, deletedAt: null },
      select: { id: true },
    });
    if (!video) throw new NotFoundException('Video not found');

    const created = await this.prisma.comment.create({
      data: {
        videoId,
        userId: params.userId,
        body: params.body.trim(),
        parentId,
      },
      include: {
        user: { select: { id: true, email: true } },
      },
    });
    return created;
  }
}
