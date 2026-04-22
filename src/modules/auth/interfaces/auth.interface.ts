export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface JwtTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterResponse {
  message: string;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isEmailVerified: boolean;
  };
}

export interface LoginResponse {
  message: string;
  tokens: JwtTokens;
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isEmailVerified: boolean;
  };
}
