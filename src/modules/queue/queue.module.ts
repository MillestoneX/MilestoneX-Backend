import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../database/prisma.module';
import { StellarSyncProcessor } from './stellar-sync.processor';
import { StellarSyncScheduler } from './stellar-sync.scheduler';

export const STELLAR_SYNC_QUEUE = 'stellar-sync';

@Module({
  imports: [
    PrismaModule,
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          password: config.get<string>('REDIS_PASSWORD'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: STELLAR_SYNC_QUEUE }),
  ],
  providers: [StellarSyncProcessor, StellarSyncScheduler],
  exports: [BullModule],
})
export class QueueModule {}
