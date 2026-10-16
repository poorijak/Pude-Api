import { ApiProperty } from '@nestjs/swagger';

export class GenTokenDto {
  @ApiProperty({
    description:
      'User UUID to generate tokens for. If omitted, uses an existing user or creates a new test user.',
    example: '60fa0545-8046-4408-833a-5506d0022a71',
    required: false,
  })
  userId?: string;
}
