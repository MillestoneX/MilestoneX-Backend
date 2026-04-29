import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { STELLAR_SYNC_QUEUE } from './queue.module';
import { STELLAR_POLL_JOB } from './stellar-sync.processor';

@Injectable()
export class StellarSyncScheduler implements OnModuleInit {
  private readonly logger = new Logger(StellarSyncScheduler.name);

  constructor(@InjectQueue(STELLAR_SYNC_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    // Remove any existing repeatable job before adding to avoid duplicates
    const repeatables = await this.queue.getRepeatableJobs();
    for (const job of repeatables) {
      if (job.name === STELLAR_POLL_JOB) {
        await this.queue.removeRepeatableByKey(job.key);
      }
    }

    await this.queue.add(
      STELLAR_POLL_JOB,
      {},
      { repeat: { every: 30_000 } }, // every 30 seconds
    );

    this.logger.log('Stellar Horizon polling job scheduled (every 30s)');
  }
}
