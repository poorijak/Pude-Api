import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { frontendOrigin, safeReturnTo } from './auth.config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { readCookie, type AuthRequest, type GoogleRequest } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @Header('Cache-Control', 'no-store')
  @Header('Referrer-Policy', 'no-referrer')
  async googleCallback(@Req() req: GoogleRequest, @Res() res: Response) {
    const userId = await this.authService.loginWithGoogle(req.user);
    const code = await this.authService.createOneTimeCode(userId);
    const target = new URL('/api/auth/callback', frontendOrigin());
    target.searchParams.set('code', code);
    target.searchParams.set('return_to', safeReturnTo(req.oauthReturnTo));
    res.redirect(target.toString());
  }

  @Post('exchange')
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  async exchange(
    @Body('code') code: unknown,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.exchangeCode(code);
    res.cookie(
      'accessToken',
      tokens.accessToken,
      this.authService.getCookieOptions('access'),
    );
    res.cookie(
      'refreshToken',
      tokens.refreshToken,
      this.authService.getCookieOptions('refresh'),
    );
    return tokens;
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @Header('Cache-Control', 'no-store')
  getMe(@Req() req: AuthRequest) {
    return this.authService.getMe(req.user.userId);
  }

  @Get('refresh')
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = readCookie(req, 'refreshToken');
    if (!token) throw new UnauthorizedException('No refresh token');
    const accessToken = await this.authService.refreshAccessToken(token);
    res.cookie(
      'accessToken',
      accessToken,
      this.authService.getCookieOptions('access'),
    );
    return { ok: true };
  }

  @Post('signout')
  @HttpCode(200)
  signout(@Res({ passthrough: true }) res: Response) {
    for (const type of ['access', 'refresh'] as const) {
      const options = this.authService.getCookieOptions(type);
      delete options.maxAge;
      res.clearCookie(`${type}Token`, options);
    }
    return { success: true };
  }
}
