import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import type { CookieOptions } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import {
  ACCESS_TOKEN_SECONDS,
  REFRESH_TOKEN_SECONDS,
  JWT_AUDIENCE,
  JWT_ISSUER,
} from './auth.config';
import type { GoogleUser, TokenPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithGoogle(profile: GoogleUser) {
    const where = {
      provider_providerAccountId: {
        provider: profile.provider,
        providerAccountId: profile.providerAccountId,
      },
    };
    const existing = await this.prisma.account.findUnique({ where });
    if (existing) return this.updateGoogleUser(existing.userId, profile);
    try {
      const account = await this.prisma.account.create({
        data: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
          email: profile.email,
          user: { create: { name: profile.name, surname: profile.surname } },
        },
      });
      return account.userId;
    } catch (error) {
      // Concurrent first logins must resolve to the same Google account.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      )
        throw error;
      const account = await this.prisma.account.findUniqueOrThrow({ where });
      return this.updateGoogleUser(account.userId, profile);
    }
  }

  private async updateGoogleUser(userId: string, profile: GoogleUser) {
    await this.prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: profile.provider,
          providerAccountId: profile.providerAccountId,
        },
      },
      data: {
        email: profile.email,
        user: { update: { name: profile.name, surname: profile.surname } },
      },
    });
    return userId;
  }

  async createOneTimeCode(userId: string) {
    const code = randomBytes(32).toString('base64url');
    await this.prisma.authCode.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });
    await this.prisma.authCode.create({
      data: {
        codeHash: this.hashCode(code),
        userId,
        expiresAt: new Date(Date.now() + 30_000),
      },
    });
    return code;
  }

  async exchangeCode(code: unknown) {
    if (typeof code !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(code)) {
      throw new UnauthorizedException('Invalid or expired code');
    }
    const codeHash = this.hashCode(code);
    const userId = await this.prisma.$transaction(async (tx) => {
      const entry = await tx.authCode.findUnique({ where: { codeHash } });
      if (!entry) throw new UnauthorizedException('Invalid or expired code');
      const consumed = await tx.authCode.deleteMany({
        where: { codeHash, expiresAt: { gt: new Date() } },
      });
      if (consumed.count !== 1)
        throw new UnauthorizedException('Invalid or expired code');
      return entry.userId;
    });
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, type: 'access' },
        { expiresIn: ACCESS_TOKEN_SECONDS },
      ),
      this.jwt.signAsync(
        { sub: userId, type: 'refresh' },
        { expiresIn: REFRESH_TOKEN_SECONDS },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  async refreshAccessToken(token: string) {
    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token, {
        algorithms: ['HS256'],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      if (payload.type !== 'refresh' || typeof payload.sub !== 'string')
        throw new Error('Invalid token');
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return this.jwt.signAsync(
      { sub: user.id, type: 'access' },
      { expiresIn: ACCESS_TOKEN_SECONDS },
    );
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  getCookieOptions(type: 'access' | 'refresh'): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge:
        1000 *
        (type === 'access' ? ACCESS_TOKEN_SECONDS : REFRESH_TOKEN_SECONDS),
    };
  }

  private hashCode(code: string) {
    return createHash('sha256').update(code).digest('hex');
  }
}
