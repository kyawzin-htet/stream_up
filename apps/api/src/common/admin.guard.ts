import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user?.id) return false;
    // Check the Admin table — O(1) indexed lookup by userId.
    const admin = await this.prisma.admin.findUnique({ where: { userId: user.id } });
    return !!admin;
  }
}
