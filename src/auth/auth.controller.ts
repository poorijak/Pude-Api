import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCookieAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { frontendOrigin, safeReturnTo } from './auth.config';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import {
  extractOptionalUserId,
  readCookie,
  type GoogleRequest,
} from './auth.types';
import { ExchangeCodeDto } from './dto/exchange-code.dto';
import { GenTokenDto } from './dto/gen-token.dto';
import { MockUserDto } from './data/mock-users.data';
import { UserEntity } from './entities/user.entity';
import {
  AuthTokensEntity,
  GenTokenResponseDto,
  SignoutResponseDto,
  SuccessResponseDto,
} from './entities/tokens.entity';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'เริ่มต้นล็อกอินด้วย Google OAuth',
    description: 'Redirect ไปยังหน้ายืนยันตัวตนของ Google',
  })
  googleLogin() {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth Callback URL',
    description:
      'รับ Callback จาก Google แล้ว Redirect กลับไปยัง Frontend พร้อม One-time Code',
  })
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
  @ApiOperation({
    summary: 'แลกเปลี่ยน One-time Code เป็น JWT Access & Refresh Tokens',
    description:
      'ใช้ Code ที่ได้จาก Google Callback เพื่อออก accessToken และ refreshToken ทั้งในรูปแบบ Body และ HTTP-only Cookie',
  })
  @ApiBody({ type: ExchangeCodeDto })
  @ApiResponse({
    status: 200,
    description: 'แลกเปลี่ยน Token สำเร็จ',
    type: AuthTokensEntity,
  })
  @ApiResponse({
    status: 401,
    description: 'Code ไม่ถูกต้องหรือหมดอายุ',
  })
  @Header('Cache-Control', 'no-store')
  async exchange(
    @Body() body: ExchangeCodeDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AuthTokensEntity> {
    const tokens = await this.authService.exchangeCode(body.code);
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

  @Post('gentoken')
  @HttpCode(200)
  @ApiOperation({
    summary: 'สร้าง JWT Access & Refresh Tokens โดยใช้ userId',
    description:
      'สร้าง accessToken และ refreshToken สำหรับ userId ที่ระบุ พร้อมทั้ง set HTTP-only cookie (หากไม่ระบุ userId หรือยังไม่มี จะดึงหรือสร้าง User ทดสอบให้อัตโนมัติ)',
  })
  @ApiBody({ type: GenTokenDto, required: false })
  @ApiResponse({
    status: 200,
    description: 'สร้าง Token สำเร็จ',
    type: GenTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'userId ไม่ถูกต้อง (ต้องเป็นรูปแบบ UUID)',
  })
  @Header('Cache-Control', 'no-store')
  async genToken(
    @Body() body: GenTokenDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GenTokenResponseDto> {
    const result = await this.authService.generateTokens(body?.userId);
    res.cookie(
      'accessToken',
      result.accessToken,
      this.authService.getCookieOptions('access'),
    );
    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.authService.getCookieOptions('refresh'),
    );
    return result;
  }

  @Get('gentoken/:userId')
  @ApiOperation({
    summary:
      'สร้าง JWT Token โดยระบุ userId ใน URL Path (สะดวกสำหรับทดสอบผ่าน Browser)',
    description:
      'สร้าง accessToken และ refreshToken โดยส่ง userId มาใน path parameter พร้อม set HTTP-only cookie',
  })
  @ApiParam({
    name: 'userId',
    description: 'User UUID',
    example: '60fa0545-8046-4408-833a-5506d0022a71',
  })
  @ApiResponse({
    status: 200,
    description: 'สร้าง Token สำเร็จ',
    type: GenTokenResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'userId ไม่ถูกต้อง (ต้องเป็นรูปแบบ UUID)',
  })
  @Header('Cache-Control', 'no-store')
  async genTokenByParam(
    @Param('userId') userId: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GenTokenResponseDto> {
    const result = await this.authService.generateTokens(userId);
    res.cookie(
      'accessToken',
      result.accessToken,
      this.authService.getCookieOptions('access'),
    );
    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.authService.getCookieOptions('refresh'),
    );
    return result;
  }

  @Get('mock-users')
  @ApiOperation({
    summary: 'ดึงรายชื่อ Mock Users ทั้งหมดสำหรับใช้ในการทดสอบ',
    description:
      'คืนค่ารายการ Mock Users สำหรับจำลองเคสต่างๆ (เช่น User ที่ยังไม่ผ่าน Pre-test, ผ่านแล้ว, และระดับสูง)',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงรายชื่อ Mock Users สำเร็จ',
    type: [MockUserDto],
  })
  @Header('Cache-Control', 'no-store')
  getMockUsers(): MockUserDto[] {
    return this.authService.getMockUsers();
  }

  @Get('mock-login/:userId')
  @ApiOperation({
    summary: 'ล็อกอินจำลองด้วย Mock User และ Redirect ไปยัง Frontend',
    description:
      'สร้าง Token, เซ็ต HTTP-only Cookie (accessToken, refreshToken) และ Redirect ไปยัง Frontend ทันที',
  })
  @ApiParam({
    name: 'userId',
    description: 'UUID ของ Mock User ที่ต้องการเข้าสู่ระบบ',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiQuery({
    name: 'returnTo',
    required: false,
    description: 'Path บน Frontend ที่ต้องการให้ Redirect ไปหลัง Login',
    example: '/',
  })
  @Header('Cache-Control', 'no-store')
  async mockLogin(
    @Param('userId') userId: string,
    @Query('returnTo') returnTo: string | undefined,
    @Res() res: Response,
  ) {
    const result = await this.authService.generateTokens(userId);
    res.cookie(
      'accessToken',
      result.accessToken,
      this.authService.getCookieOptions('access'),
    );
    res.cookie(
      'refreshToken',
      result.refreshToken,
      this.authService.getCookieOptions('refresh'),
    );

    const redirectPath = safeReturnTo(returnTo);
    const target = new URL(redirectPath, frontendOrigin());
    res.redirect(target.toString());
  }

  @Get('me')
  @ApiOperation({
    summary: 'ดึงข้อมูลโปรไฟล์ของผู้ใช้ (ไม่ต้องมี Token ก็ได้)',
    description:
      'ดึงข้อมูล User ปัจจุบันจาก Cookie/Bearer Token (ถ้ามี) หรือระบุ ?userId=... หรือคืนค่า User เริ่มต้น',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'UUID ของผู้ใช้ (ไม่จำเป็นต้องระบุ)',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงข้อมูลโปรไฟล์สำเร็จ',
    type: UserEntity,
  })
  @Header('Cache-Control', 'no-store')
  getMe(
    @Query('userId') queryUserId?: string,
    @Req() req?: Request,
  ): Promise<UserEntity> {
    const userId = extractOptionalUserId(req, queryUserId);
    return this.authService.getMe(userId);
  }

  @Get('refresh')
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'ต่ออายุ Access Token ด้วย Refresh Token Cookie',
    description: 'ตรวจสอบ Refresh Token และออก Access Token ใหม่ในคุกกี้',
  })
  @ApiResponse({
    status: 200,
    description: 'ต่ออายุสำเร็จ',
    type: SuccessResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh Token ไม่ถูกต้องหรือหมดอายุ',
  })
  @Header('Cache-Control', 'no-store')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<SuccessResponseDto> {
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
  @ApiOperation({
    summary: 'ออกจากระบบ (Sign out)',
    description: 'ล้าง accessToken และ refreshToken ใน Cookie',
  })
  @ApiResponse({
    status: 200,
    description: 'ออกจากระบบสำเร็จ',
    type: SignoutResponseDto,
  })
  signout(@Res({ passthrough: true }) res: Response): SignoutResponseDto {
    for (const type of ['access', 'refresh'] as const) {
      const options = this.authService.getCookieOptions(type);
      delete options.maxAge;
      res.clearCookie(`${type}Token`, options);
    }
    return { success: true };
  }
}
