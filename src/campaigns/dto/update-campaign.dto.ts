import {
  IsOptional,
  IsString,
  MaxLength,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/** DTO for updating an existing campaign (partial update) */
export class UpdateCampaignDto {
  @ApiPropertyOptional({ description: 'Campaign title', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Campaign description' })
  @IsOptional()
  @IsString()
  description?: string;

  /** Some clients send a 'story' field — treat as an alias for description */
  @ApiPropertyOptional({
    description: 'Campaign story (alias for description)',
  })
  @IsOptional()
  @IsString()
  story?: string;

  @ApiPropertyOptional({ description: 'Cover image URL' })
  @IsOptional()
  @IsString()
  @IsUrl()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Campaign category' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ description: 'Campaign end date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
