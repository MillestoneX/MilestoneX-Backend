import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  walletAddress: string;
  role: UserRole;
}

export interface AuthResponse {
  accessToken: string;
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