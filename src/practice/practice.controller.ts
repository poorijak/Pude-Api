import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { PracticeService } from './practice.service';
import { extractOptionalUserId } from '../auth/auth.types';
import {
  CompletePretestResponseDto,
  PretestResponseDto,
} from './dto/pretest-response.dto';
import { CompletePretestDto } from './dto/complete-pretest.dto';

@ApiTags('Practice')
@Controller('practice')
export class PracticeController {
  constructor(private readonly practiceService: PracticeService) {}

  @Get('pretest')
  @ApiOperation({
    summary: 'ดึงแบบทดสอบก่อนเรียน (Pre-test)',
    description:
      'ดึงรายการคำถาม Pre-test ทั้งหมด 15 ข้อ (ไม่ต้องใช้ Auth Token / สามารถระบุ userId เพื่อตรวจสอบสถานะ หรือไม่ระบุก็ได้)',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'UUID ของผู้ใช้ (ไม่จำเป็นต้องระบุ)',
    example: '11111111-1111-4111-8111-111111111111',
  })
  @ApiResponse({
    status: 200,
    description: 'ดึงแบบทดสอบสำเร็จ',
    type: PretestResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'กรณีระบุ userId และผู้ใช้งานผ่านการประเมินไปแล้ว (Forbidden)',
  })
  @Header('Cache-Control', 'no-store')
  getPretest(
    @Query('userId') queryUserId?: string,
    @Req() req?: Request,
  ): Promise<PretestResponseDto> {
    const userId = extractOptionalUserId(req, queryUserId);
    return this.practiceService.getPretestQuestions(userId);
  }

  @Post('pretest/complete')
  @ApiOperation({
    summary: 'บันทึกสถานะผ่านแบบทดสอบก่อนเรียน',
    description:
      'อัปเดตสถานะของ User เป็น is_pretest_passed: true (สามารถส่ง userId ผ่าน Body/Query หรือไม่ส่งก็ได้)',
  })
  @ApiBody({ type: CompletePretestDto, required: false })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'UUID ของผู้ใช้ (ไม่จำเป็นต้องระบุ)',
  })
  @ApiResponse({
    status: 200,
    description: 'บันทึกสถานะสำเร็จ',
    type: CompletePretestResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'กรณีผู้ใช้งานผ่านการประเมินไปแล้ว',
  })
  @HttpCode(HttpStatus.OK)
  completePretest(
    @Body() body?: CompletePretestDto,
    @Query('userId') queryUserId?: string,
    @Req() req?: Request,
  ): Promise<CompletePretestResponseDto> {
    const userId = extractOptionalUserId(req, body?.userId || queryUserId);
    return this.practiceService.completePretest(userId);
  }
}
