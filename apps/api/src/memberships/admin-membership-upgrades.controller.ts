import { Controller, Get, Logger, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Readable } from 'stream';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../common/admin.guard';
import { MembershipsService } from './memberships.service';
import { TelegramService } from '../telegram/telegram.service';
import { CurrentUser } from '../common/current-user.decorator';
import { MembershipUpgradeStatus } from '@prisma/client';

@Controller('admin/membership-upgrades')
export class AdminMembershipUpgradesController {
  private readonly logger = new Logger(AdminMembershipUpgradesController.name);

  constructor(
    private readonly memberships: MembershipsService,
    private readonly telegram: TelegramService,
  ) {}

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get()
  async list(
    @Query('status') status?: MembershipUpgradeStatus,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    const allowed: MembershipUpgradeStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];
    const safeStatus = status && allowed.includes(status) ? status : undefined;

    return this.memberships.listUpgradeRequestsAdmin({
      status: safeStatus,
      page: Math.max(1, Number(page) || 1),
      pageSize: Math.min(50, Math.max(1, Number(pageSize) || 20)),
    });
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('summary')
  async summary() {
    return this.memberships.upgradeSummary();
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/approve')
  async approve(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.memberships.approveUpgradeRequest(id, user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post(':id/reject')
  async reject(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.memberships.rejectUpgradeRequest(id, user.id);
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get(':id/slip')
  async slip(@Param('id') id: string, @Res() res: Response) {
    const request = await this.memberships.getUpgradeRequest(id);
    const fileInfo = await this.telegram.getFile(request.paymentSlipFileId);
    const range = res.req.headers.range as string | undefined;
    const fileResponse = await this.telegram.fetchFileStream(fileInfo.file_path, range);

    if (!fileResponse.ok || !fileResponse.body) {
      res.status(502).json({ message: 'Failed to load pay slip' });
      return;
    }

    const headers: Record<string, string> = {
      'Content-Type': fileResponse.headers.get('content-type') || 'image/jpeg',
      'Content-Length': fileResponse.headers.get('content-length') || '',
    };

    const contentRange = fileResponse.headers.get('content-range');
    if (contentRange) headers['Content-Range'] = contentRange;
    const acceptRanges = fileResponse.headers.get('accept-ranges');
    if (acceptRanges) headers['Accept-Ranges'] = acceptRanges;

    const statusCode = fileResponse.status;
    res.status(statusCode);
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
      this.logger.warn(`Slip stream error for request ${id}: ${String(error)}`);
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
