import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';

@Controller('membership-upgrades')
export class MembershipUpgradesController {
  constructor(private readonly memberships: MembershipsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: Number(process.env.UPLOAD_MAX_MB || 10) * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) {
          cb(new BadRequestException('Only JPG/PNG uploads are allowed'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body('planId') planId: string,
    @Body('note') note: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    if (!file) throw new BadRequestException('Missing file');
    if (!planId) throw new BadRequestException('Missing plan');

    return this.memberships.createUpgradeRequest({
      userId: user.id,
      planId,
      note,
      file,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async listMine(@CurrentUser() user: { id: string }) {
    return this.memberships.listUpgradeRequestsForUser(user.id);
  }
}
