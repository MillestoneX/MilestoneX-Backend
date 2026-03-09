import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Email verification token sent to user email',
    example: 'abc123def456',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
