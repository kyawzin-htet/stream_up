import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VideosModule } from './videos/videos.module';
import { CategoriesModule } from './categories/categories.module';
import { MembershipsModule } from './memberships/memberships.module';
import { TelegramModule } from './telegram/telegram.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminModule } from './admin/admin.module';
import { CommentsModule } from './comments/comments.module';
import { GalleryImagesModule } from './gallery-images/gallery-images.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    VideosModule,
    CategoriesModule,
    MembershipsModule,
    TelegramModule,
    AdminModule,
    CommentsModule,
    GalleryImagesModule,
  ],
})
export class AppModule {}
