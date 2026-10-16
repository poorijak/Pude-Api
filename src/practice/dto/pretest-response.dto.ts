import { ApiProperty } from '@nestjs/swagger';
import { QuestionEntity } from '../entities/question.entity';

export class PretestResponseDto {
  @ApiProperty({
    description: 'Total number of pretest questions returned',
    example: 15,
  })
  total: number;

  @ApiProperty({
    description: 'Array of pretest questions',
    type: [QuestionEntity],
  })
  questions: QuestionEntity[];
}

export class CompletedUserDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' })
  id: string;

  @ApiProperty({ example: 'สมชาย' })
  name: string;

  @ApiProperty({ example: 'ใจดี' })
  surname: string;

  @ApiProperty({ example: true })
  is_pretest_passed: boolean;

  @ApiProperty({ example: 1 })
  current_level: number;

  @ApiProperty({ example: 1 })
  current_stage: number;
}

export class CompletePretestResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CompletedUserDto })
  user: CompletedUserDto;
}
