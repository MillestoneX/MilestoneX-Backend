import { AppConfig } from "./type";

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  databaseUrl: process.env.DATABASE_URL!,
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  stellarNetwork: process.env.STELLAR_NETWORK as 'TESTNET' | 'PUBLIC',
  stellarHorizonUrl: process.env.STELLAR_HORIZON_URL!,
});