import { ApiProperty } from '@nestjs/swagger';

export class AuthTokensEntity {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'JWT Refresh Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

export class SignoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class GenTokenResponseDto extends AuthTokensEntity {
  @ApiProperty({
    description: 'User UUID for which tokens were generated',
    example: '60fa0545-8046-4408-833a-5506d0022a71',
  })
  userId: string;
}
