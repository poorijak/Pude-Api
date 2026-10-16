import { ApiProperty } from '@nestjs/swagger';

export class MockUserDto {
  @ApiProperty({
    description: 'Mock User UUID',
    example: '11111111-1111-4111-8111-111111111111',
  })
  id: string;

  @ApiProperty({ description: 'First name', example: 'สมชาย' })
  name: string;

  @ApiProperty({ description: 'Last name', example: 'ใจดี' })
  surname: string;

  @ApiProperty({
    description: 'Mock email',
    example: 'somchai.pretest@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Whether user has passed the initial pretest',
    example: false,
  })
  is_pretest_passed: boolean;

  @ApiProperty({ description: 'Current level (1-3)', example: 1 })
  current_level: number;

  @ApiProperty({ description: 'Current stage', example: 1 })
  current_stage: number;

  @ApiProperty({ description: 'Current consecutive streak', example: 0 })
  current_streak: number;

  @ApiProperty({ description: 'Longest streak', example: 0 })
  longest_streak: number;

  @ApiProperty({
    description: 'Role and test scenario description',
    example:
      'ผู้ใช้ใหม่ ยังไม่ผ่านแบบทดสอบก่อนเรียน (สำหรับทดสอบ /practice/pretest)',
  })
  roleDescription: string;
}

export const MOCK_USERS: MockUserDto[] = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'สมชาย',
    surname: 'ใจดี',
    email: 'somchai.pretest@example.com',
    is_pretest_passed: false,
    current_level: 1,
    current_stage: 1,
    current_streak: 0,
    longest_streak: 0,
    roleDescription:
      'ผู้ใช้ใหม่ ยังไม่ผ่านแบบทดสอบก่อนเรียน (สำหรับทดสอบ /practice/pretest และหน้าประเมิน)',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'สมหญิง',
    surname: 'รักเรียน',
    email: 'somying.passed@example.com',
    is_pretest_passed: true,
    current_level: 2,
    current_stage: 3,
    current_streak: 5,
    longest_streak: 10,
    roleDescription:
      'ผู้ใช้ระดับกลาง ผ่านแบบทดสอบก่อนเรียนแล้ว (สำหรับทดสอบการเข้าเรียนปกติ / Dashboard)',
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'มานะ',
    surname: 'อดทน',
    email: 'mana.advanced@example.com',
    is_pretest_passed: true,
    current_level: 3,
    current_stage: 5,
    current_streak: 21,
    longest_streak: 30,
    roleDescription:
      'ผู้ใช้ระดับสูง เลเวล 3 สตรีคต่อเนื่อง 21 วัน (สำหรับทดสอบโหมดสนทนาและประโยคยาว)',
  },
];
