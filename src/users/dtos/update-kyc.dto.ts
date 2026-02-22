import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { KYCStatus } from '../entities/user.entity';

export class UpdateKYCDto {
  @IsEnum(KYCStatus)
  @IsNotEmpty()
  status: KYCStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
