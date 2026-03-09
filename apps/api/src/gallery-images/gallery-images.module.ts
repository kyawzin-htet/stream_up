import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { GalleryImagesController } from './gallery-images.controller';
import { GalleryImagesService } from './gallery-images.service';
import { TelegramModule } from '../telegram/telegram.module';

@Module({
  imports: [
    TelegramModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'change-me',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '7d' },
      }),
    }),
  ],
  controllers: [GalleryImagesController],
  providers: [GalleryImagesService],
})
export class GalleryImagesModule {}
