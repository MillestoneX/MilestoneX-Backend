import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsArray,
  IsNotEmpty,
  IsNumberString,
  Matches,
  ValidateNested,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class MilestoneInput {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  // Accept numeric strings to preserve precision for Decimal columns.
  @IsNotEmpty()
  @IsNumberString()
  @Matches(/^(?=.*[1-9])\d+(?:\.\d+)?$/, {
    message: 'targetAmount must be greater than 0',
  })
  targetAmount: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string; // ISO date string
}

/** DTO for creating a new fundraising campaign */
export class CreateCampaignDto {
  @ApiProperty({ description: 'Campaign title', maxLength: 200 })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  title: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @ApiPropertyOptional({ description: 'Campaign story / extended narrative' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  story?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Campaign category', maxLength: 100 })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  category?: string;

  @ApiPropertyOptional({ description: 'Fundraising goal amount (numeric string)' })
  @IsOptional()
  @IsString()
  goalAmount?: string;

  @ApiPropertyOptional({ description: 'Campaign milestones' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MilestoneInput)
  milestones?: MilestoneInput[];

  @ApiPropertyOptional({ description: 'Accepted asset codes (e.g. XLM, USDC:issuer)' })
  @IsOptional()
  @IsArray()
  acceptedAssets?: string[];

  @ApiPropertyOptional({ description: 'Soroban contract ID' })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({ description: 'Stellar network (testnet|mainnet)' })
  @IsOptional()
  @IsString()
  network?: string;

  @ApiPropertyOptional({ description: 'Campaign end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
