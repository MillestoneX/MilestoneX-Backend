export interface JwtPayload {
  sub: string; // user id
  email: string;
  walletAddress: string;
}

export interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    walletAddress: string;
  };
}