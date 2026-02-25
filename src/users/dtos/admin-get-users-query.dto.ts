import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Matches, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { KYCStatus, UserRole } from '../entities/user.entity';

export class AdminGetUsersQueryDto {
  @ApiPropertyOptional({
    description: 'Filter users by role',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    name: 'kyc_status',
    description: 'Filter users by KYC status',
    enum: KYCStatus,
    example: KYCStatus.PENDING,
  })
  @IsOptional()
  @IsEnum(KYCStatus)
  kyc_status?: KYCStatus;

  @ApiPropertyOptional({
    name: 'created_date',
    description: 'Filter users created on a specific date (YYYY-MM-DD)',
    example: '2026-02-25',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  created_date?: string;

  @ApiPropertyOptional({
    description: 'Number of results per page',
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Number of results to skip (for pagination)',
    minimum: 0,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
