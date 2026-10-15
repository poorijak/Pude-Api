import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import type { CookieOptions, Response } from 'express';
import { JWT_AUDIENCE, JWT_ISSUER, safeReturnTo } from '../auth.config';
import { readCookie, type GoogleRequest, type OAuthState } from '../auth.types';

const STATE_COOKIE = 'googleOAuthState';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  constructor(private readonly jwt: JwtService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<GoogleRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    if (req.path.endsWith('/callback')) {
      const state = req.query.state;
      const savedState = readCookie(req, STATE_COOKIE);
      res.clearCookie(STATE_COOKIE, this.cookieOptions());
      if (
        typeof state !== 'string' ||
        !savedState ||
        Buffer.byteLength(state) !== Buffer.byteLength(savedState) ||
        !timingSafeEqual(Buffer.from(state), Buffer.from(savedState))
      ) {
        throw new UnauthorizedException('Invalid OAuth state');
      }
      try {
        const payload = await this.jwt.verifyAsync<OAuthState>(state, {
          algorithms: ['HS256'],
          issuer: JWT_ISSUER,
          audience: JWT_AUDIENCE,
        });
        if (payload.type !== 'oauth-state')
          throw new Error('Invalid state type');
        req.oauthReturnTo = safeReturnTo(payload.returnTo);
      } catch {
        throw new UnauthorizedException('Invalid or expired OAuth state');
      }
    }
    return (await super.canActivate(context)) as boolean;
  }

  getAuthenticateOptions(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<GoogleRequest>();
    if (req.path.endsWith('/callback')) return { session: false };
    const state = this.jwt.sign(
      {
        type: 'oauth-state',
        nonce: randomUUID(),
        returnTo: safeReturnTo(req.query.callBackUrl),
      },
      { expiresIn: '10m' },
    );
    context
      .switchToHttp()
      .getResponse<Response>()
      .cookie(STATE_COOKIE, state, {
        ...this.cookieOptions(),
        maxAge: 10 * 60 * 1000,
      });
    return { session: false, state };
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth/google',
    };
  }
}
