import { IsString, IsNotEmpty, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO for filing a new dispute against a donation */
export class FileDisputeDto {
  @ApiProperty({ description: 'ID of the donation being disputed' })
  @IsUUID()
  @IsNotEmpty()
  donationId: string;

  @ApiProperty({
    description: 'Short reason / category for the dispute',
    maxLength: 200,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  reason: string;

  @ApiProperty({
    description: 'Detailed description of the dispute',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  description: string;
}

/** DTO for admin resolving a dispute */
export class ResolveDisputeDto {
  @ApiProperty({
    description: 'Resolution details explaining the outcome',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  resolution: string;
}
