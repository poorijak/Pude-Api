import { ApiProperty } from '@nestjs/swagger';

export class UserEntity {
  @ApiProperty({
    description: 'User UUID',
    example: '60fa0545-8046-4408-833a-5506d0022a71',
  })
  id: string;

  @ApiProperty({ description: 'First name', example: 'สมชาย' })
  name: string;

  @ApiProperty({ description: 'Last name', example: 'ใจดี' })
  surname: string;

  @ApiProperty({ description: 'Current practice level', example: 1 })
  current_level: number;

  @ApiProperty({ description: 'Current practice stage', example: 1 })
  current_stage: number;

  @ApiProperty({ description: 'Current consecutive daily streak', example: 0 })
  current_streak: number;

  @ApiProperty({ description: 'Longest consecutive daily streak', example: 0 })
  longest_streak: number;

  @ApiProperty({
    description: 'Whether the user has passed the initial pretest',
    example: false,
  })
  is_pretest_passed: boolean;

  @ApiProperty({
    description: 'Date of last practice session',
    example: null,
    nullable: true,
  })
  last_practice_date: Date | null;

  @ApiProperty({
    description: 'Account creation timestamp',
    example: '2026-10-16T00:00:00.000Z',
  })
  created: Date;

  @ApiProperty({
    description: 'Account last updated timestamp',
    example: '2026-10-16T00:00:00.000Z',
  })
  updatedDate: Date;
}
