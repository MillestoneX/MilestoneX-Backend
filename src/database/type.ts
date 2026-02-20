export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  stellarNetwork: 'TESTNET' | 'PUBLIC';
  stellarHorizonUrl: string;
}