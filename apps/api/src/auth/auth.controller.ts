import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../common/public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.auth.register(dto.email, dto.password);
  }

  @Public()
  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() user: { id: string }) {
    return this.auth.getProfile(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('telegram-link')
  async createTelegramLink(@CurrentUser() user: { id: string }) {
    const token = await this.auth.createTelegramLinkToken(user.id);
    const username = this.config.get<string>('TELEGRAM_BOT_USERNAME') || '';
    const deepLink = username
      ? `https://t.me/${username}?start=link_${token}`
      : null;
    return { token, deepLink };
  }
}
