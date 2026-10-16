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

  @ApiProperty({
    description: 'User ID of the logged in user',
    example: '11111111-1111-4111-8111-111111111111',
  })
  userId: string;
}

export class SuccessResponseDto {
  @ApiProperty({ example: true })
  ok: boolean;
}

export class SignoutResponseDto {
  @ApiProperty({ example: true })
  success: boolean;
}

export class GenTokenResponseDto extends AuthTokensEntity {}
