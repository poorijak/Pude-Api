import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { JWT_AUDIENCE, JWT_ISSUER, requiredEnv } from '../auth.config';
import { readCookie, type TokenPayload } from '../auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => readCookie(req, 'accessToken'),
      ]),
      secretOrKey: requiredEnv('JWT_SECRET'),
      algorithms: ['HS256'],
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      ignoreExpiration: false,
    });
  }

  async validate(payload: TokenPayload) {
    if (payload.type !== 'access' || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid access token');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('User not found');
    return { userId: user.id };
  }
}
