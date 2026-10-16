import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PracticeService } from './practice.service';
import type { AuthRequest } from '../auth/auth.types';
import {
  CompletePretestResponseDto,
  PretestResponseDto,
} from './dto/pretest-response.dto';

@ApiTags('Practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('pretest')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiOperation({
    summary: 'ดึงแบบทดสอบก่อนเรียน (Pre-test)',
    description:
      'ดึงรายการคำถาม Pre-test ทั้งหมด 15 ข้อ สำหรับผู้ใช้ที่ยังไม่เคยผ่านการประเมิน (หากผ่านแล้วจะตอบกลับเป็น 403 Forbidden)',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงแบบทดสอบสำเร็จ',
    type: PretestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'ยังไม่ได้เข้าสู่ระบบ (Unauthorized)',
  })
  @ApiResponse({
    status: 403,
    description: 'ผู้ใช้งานผ่านการประเมินแบบทดสอบก่อนเรียนแล้ว (Forbidden)',
  })
  @Header('Cache-Control', 'no-store')
  getPretest(@Req() req: AuthRequest): Promise<PretestResponseDto> {
    return this.practiceService.getPretestQuestions(req.user.userId);
  }

  @Post('pretest/complete')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('bearer')
  @ApiCookieAuth('accessToken')
  @ApiOperation({
    summary: 'บันทึกสถานะผ่านแบบทดสอบก่อนเรียน',
    description:
      'อัปเดตสถานะของ User เป็น is_pretest_passed: true เมื่อทำแบบทดสอบเสร็จสิ้น',
  })
  @ApiResponse({
    status: 200,
    description: 'บันทึกสถานะสำเร็จ',
    type: CompletePretestResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'ยังไม่ได้เข้าสู่ระบบ (Unauthorized)',
  })
  @ApiResponse({
    status: 403,
    description: 'ผู้ใช้งานผ่านการประเมินไปแล้ว',
  })
  @HttpCode(HttpStatus.OK)
  completePretest(
    @Req() req: AuthRequest,
  ): Promise<CompletePretestResponseDto> {
    return this.practiceService.completePretest(req.user.userId);
  }
}
