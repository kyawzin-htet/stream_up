import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.email) return false;

    const raw = this.config.get<string>('ADMIN_EMAILS') || '';
    const emails = raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    return emails.includes(String(user.email).toLowerCase());
  }
}
