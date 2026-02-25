import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(email: string, password: string) {
    const existing = await this.users.findByEmail(email);
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(password, 12);
    let user;
    try {
      user = await this.users.create({ email, passwordHash });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new ConflictException('Email already registered');
      }
      throw err;
    }
    return this.issueToken(user.id, user.email);
  }

  async validateUser(email: string, password: string) {
    const user = await this.users.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    return this.issueToken(user.id, user.email);
  }

  async issueToken(userId: string, email: string) {
    const payload = { sub: userId, email };
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d',
    });
    const user = await this.users.findById(userId);
    return { accessToken, user: this.buildUserResponse(user) };
  }

  async getProfile(userId: string) {
    const user = await this.users.findById(userId);
    return this.buildUserResponse(user);
  }

  async createTelegramLinkToken(userId: string) {
    const token = uuidv4().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.telegramLinkToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  private buildUserResponse(user: any) {
    const raw = this.config.get<string>('ADMIN_EMAILS') || '';
    const admins = raw
      .split(',')
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean);

    return {
      id: user.id,
      email: user.email,
      telegramUserId: user.telegramUserId,
      membershipType: user.membershipType,
      membershipExpiresAt: user.membershipExpiresAt,
      isAdmin: admins.includes(String(user.email).toLowerCase()),
      createdAt: user.createdAt,
    };
  }
}
