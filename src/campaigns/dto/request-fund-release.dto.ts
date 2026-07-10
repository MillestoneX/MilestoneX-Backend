import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO for submitting a campaign fund release request */
export class RequestFundReleaseDto {
  @ApiProperty({
    description: 'Amount to release as numeric string',
    example: '500',
  })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({
    description: 'Human-readable reason for releasing funds',
    maxLength: 1000,
  })
  @IsOptional()
  @MaxLength(1000)
  releaseReason?: string;

  @ApiProperty({
    description: 'JSON signature payload for on-chain verification',
  })
  @IsOptional()
  signaturePayload?: string;
}

import { IsOptional } from 'class-validator';

export interface FundReleaseResponseDto {
  id: string;
  milestoneId: string;
  campaignId: string;
  creatorId: string;
  amount: string;
  status: string;
  txHash: string | null;
  releaseReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FundReleaseDetailDto {
  id: string;
  milestoneId: string;
  campaignId: string;
  campaignTitle: string;
  amount: string;
  status: string;
  releaseReason: string | null;
  txHash: string | null;
  approvedAt: Date | null;
  releasedAt: Date | null;
  createdAt: Date;
}
