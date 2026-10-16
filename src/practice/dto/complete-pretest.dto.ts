import { ApiProperty } from '@nestjs/swagger';

export class CompletePretestDto {
  @ApiProperty({
    description:
      'User UUID (ไม่จำเป็นต้องระบุ หากไม่ส่งมาระบบจะใช้ User เริ่มต้น)',
    example: '11111111-1111-4111-8111-111111111111',
    required: false,
  })
  userId?: string;
}
