import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../common/public.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Public()
  @Get('videos/:id/comments')
  async list(@Param('id') id: string) {
    return this.comments.listByVideo(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('videos/:id/comments')
  async create(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.comments.createComment({
      videoId: id,
      userId: user.id,
      body: dto.body,
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('comments/:id/replies')
  async reply(
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.comments.createComment({
      userId: user.id,
      body: dto.body,
      parentId: id,
    });
  }
}
