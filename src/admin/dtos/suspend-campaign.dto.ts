import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for suspending (cancelling) a campaign.
 * Admin must supply a reason that will be stored in the audit log
 * and included in the creator notification email.
 */
export class SuspendCampaignDto {
  @ApiProperty({
    description: 'Reason for the suspension (stored in audit log and sent to creator)',
    example: 'Campaign violates community guidelines section 3.2',
    maxLength: 500,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
