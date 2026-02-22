import { AppConfig } from "./type";

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  stellarNetwork: (process.env.STELLAR_NETWORK as 'TESTNET' | 'PUBLIC') || 'TESTNET',
  stellarHorizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  mailHost: process.env.MAIL_HOST,
  mailPort: process.env.MAIL_PORT ? parseInt(process.env.MAIL_PORT, 10) : undefined,
  mailSecure: process.env.MAIL_SECURE === 'true',
  mailUser: process.env.MAIL_USER,
  mailPass: process.env.MAIL_PASS,
  mailFrom: process.env.MAIL_FROM,
  mailSubjectPrefix: process.env.MAIL_SUBJECT_PREFIX,
  appName: process.env.APP_NAME,
  frontendUrl: process.env.FRONTEND_URL,
});