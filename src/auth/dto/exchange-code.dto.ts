import { ApiProperty } from '@nestjs/swagger';

export class ExchangeCodeDto {
  @ApiProperty({
    description:
      'One-time authorization code returned after Google OAuth callback',
    example: 'dGhpcy1pcy1hLXNhbXBsZS1vYXV0aC1jb2RlMTIzNDU2Nw',
  })
  code: string;
}
