import { ApiProperty } from '@nestjs/swagger';
import { UserRole, KYCStatus } from '../entities/user.entity';

export class ProfileResponseDto {
  @ApiProperty({ description: 'User unique identifier', example: '550e8400-e29b-41d4-a716-446655440000' })
  id: string;

  @ApiProperty({ description: 'User email address', example: 'user@example.com' })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'User role', enum: UserRole, example: UserRole.DONOR })
  role: UserRole;

  @ApiProperty({ description: 'Stellar wallet address', example: 'GAA2M7F4E3C4D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6', nullable: true })
  walletAddress: string | null;

  @ApiProperty({ description: 'User country', example: 'United States', nullable: true })
  country: string | null;

  @ApiProperty({ description: 'User bio', example: 'Passionate about social impact', nullable: true })
  bio: string | null;

  @ApiProperty({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'Whether email is verified', example: true })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'KYC verification status', enum: KYCStatus, example: KYCStatus.APPROVED })
  kycStatus: KYCStatus;

  @ApiProperty({ description: 'When KYC was submitted', format: 'date-time', nullable: true })
  kycSubmittedAt: Date | null;

  @ApiProperty({ description: 'When KYC was verified', format: 'date-time', nullable: true })
  kycVerifiedAt: Date | null;

  @ApiProperty({ description: 'Account creation timestamp', format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp', format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ description: 'Profile completion percentage', example: 85, minimum: 0, maximum: 100 })
  profileCompletionPercentage: number;
}
