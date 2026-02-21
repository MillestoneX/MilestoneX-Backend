import { UserRole } from '../../users/entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  walletAddress?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    walletAddress: string;
    role: UserRole;
    isEmailVerified: boolean;
  };
}