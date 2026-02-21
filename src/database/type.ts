export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  stellarNetwork: 'TESTNET' | 'PUBLIC';
  stellarHorizonUrl: string;
}