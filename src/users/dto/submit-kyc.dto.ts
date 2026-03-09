import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitKYCDto {
  @ApiProperty({
    description: 'URL to KYC document (ID, passport, etc.)',
    example: 'https://storage.example.com/kyc/doc123.pdf',
    format: 'url',
  })
  @IsString()
  @IsNotEmpty()
  documentUrl: string;
}
