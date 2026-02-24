import { UserRole, KYCStatus } from '../entities/user.entity';

export class ProfileResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  walletAddress: string | null;
  country: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isEmailVerified: boolean;
  kycStatus: KYCStatus;
  kycSubmittedAt: Date | null;
  kycVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profileCompletionPercentage: number;
}
