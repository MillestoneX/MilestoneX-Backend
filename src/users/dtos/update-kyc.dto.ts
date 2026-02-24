import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { KYCStatus } from '../entities/user.entity';

export class UpdateKYCDto {
  @ApiProperty({
    description: 'New KYC status',
    enum: KYCStatus,
    example: KYCStatus.APPROVED,
  })
  @IsEnum(KYCStatus)
  @IsNotEmpty()
  status: KYCStatus;

  @ApiPropertyOptional({
    description: 'Reason for rejection (required if status is REJECTED)',
    example: 'Document unclear or expired',
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
