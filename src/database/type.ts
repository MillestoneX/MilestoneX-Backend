export interface AppConfig {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
  jwtExpiresIn: string;
  stellarNetwork: 'TESTNET' | 'PUBLIC';
  stellarHorizonUrl: string;
  mailHost?: string;
  mailPort?: number;
  mailSecure?: boolean;
  mailUser?: string;
  mailPass?: string;
  mailFrom?: string;
  mailSubjectPrefix?: string;
  appName?: string;
  frontendUrl?: string;
  enableSwagger?: boolean;
}
