import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumberString,
  IsBoolean,
  IsUUID,
} from 'class-validator';

/** DTO for submitting a new on-chain donation */
export class CreateDonationDto {
  @ApiProperty({ description: 'Stellar transaction hash for the donation', example: 'abc123...' })
  @IsString()
  @IsNotEmpty()
  txHash: string;

  @ApiProperty({ description: 'Campaign UUID to donate to' })
  @IsUUID()
  @IsNotEmpty()
  campaignId: string;

  @ApiProperty({ description: 'Donation amount as a numeric string', example: '100' })
  @IsNumberString()
  amount: string;

  @ApiPropertyOptional({ description: 'Asset code (default: XLM)', example: 'XLM' })
  @IsOptional()
  @IsString()
  assetCode?: string;

  @ApiPropertyOptional({ description: 'Asset issuer address (required for non-native assets)' })
  @IsOptional()
  @IsString()
  assetIssuer?: string;

  @ApiPropertyOptional({ description: 'Whether to hide the donor identity publicly', default: false })
  @IsOptional()
  @IsBoolean()
  isAnonymous?: boolean;
}
