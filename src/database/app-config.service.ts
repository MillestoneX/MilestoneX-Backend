import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './config.type';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<AppConfig>) {}

  get port(): number {
    return this.configService.get<number>('port', { infer: true })!;
  }

  get databaseUrl(): string {
    return this.configService.get<string>('databaseUrl', { infer: true })!;
  }

  get jwtSecret(): string {
    return this.configService.get<string>('jwtSecret', { infer: true })!;
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('jwtExpiresIn', { infer: true })!;
  }

  get stellarNetwork(): 'TESTNET' | 'PUBLIC' {
    return this.configService.get<'TESTNET' | 'PUBLIC'>(
      'stellarNetwork',
      { infer: true },
    )!;
  }

  get stellarHorizonUrl(): string {
    return this.configService.get<string>('stellarHorizonUrl', {
      infer: true,
    })!;
  }
}