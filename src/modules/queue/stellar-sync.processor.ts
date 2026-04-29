import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Horizon } from '@stellar/stellar-sdk';
import { PrismaService } from '../../database/prisma.service';
import { STELLAR_SYNC_QUEUE } from './queue.module';

export const STELLAR_POLL_JOB = 'poll-horizon';

@Processor(STELLAR_SYNC_QUEUE)
export class StellarSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(StellarSyncProcessor.name);
  private readonly server: Horizon.Server;
  private readonly platformWallet: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
    const horizonUrl =
      this.config.get<string>('STELLAR_HORIZON_URL') || 'https://horizon-testnet.stellar.org';
    this.server = new Horizon.Server(horizonUrl);
    this.platformWallet = this.config.get<string>('STELLAR_PLATFORM_WALLET', '');
  }

  async process(job: Job): Promise<void> {
    if (job.name !== STELLAR_POLL_JOB) return;
    await this.pollHorizon();
  }

  private async pollHorizon(): Promise<void> {
    if (!this.platformWallet) {
      this.logger.warn('STELLAR_PLATFORM_WALLET not configured, skipping poll');
      return;
    }

    // Retrieve last processed cursor from DB (stored as a platform setting detail)
    const cursorRecord = await this.prisma.adminLog.findFirst({
      where: { action: 'STELLAR_SYNC_CURSOR' },
      orderBy: { createdAt: 'desc' },
    });
    const cursor = cursorRecord?.details ?? 'now';

    this.logger.log(`Polling Horizon from cursor: ${cursor}`);

    try {
      const payments = await (this.server
        .payments()
        .forAccount(this.platformWallet)
        .cursor(cursor)
        .limit(200)
        .order('asc') as any).call();

      const records: any[] = payments.records ?? [];
      this.logger.log(`Fetched ${records.length} payment records`);

      for (const record of records) {
        await this.processPayment(record);
      }

      // Persist cursor after processing
      if (records.length > 0) {
        const lastCursor = records[records.length - 1].paging_token;
        await this.prisma.adminLog.create({
          data: {
            adminId: 'system',
            action: 'STELLAR_SYNC_CURSOR',
            details: lastCursor,
          },
        });
      }
    } catch (err) {
      this.logger.error('Horizon poll failed', err);
      throw err; // triggers BullMQ retry
    }
  }

  private async processPayment(record: any): Promise<void> {
    if (record.type !== 'payment') return;

    const txHash: string = record.transaction_hash;

    // Skip already-processed transactions
    const existing = await this.prisma.donation.findFirst({
      where: { transactionHash: txHash },
    });
    if (existing) return;

    // Match project by memo
    const tx = await record.transaction();
    const memo: string = tx?.memo ?? '';
    if (!memo) return;

    const project = await this.prisma.project.findFirst({
      where: { id: memo, status: 'ACTIVE' },
    });
    if (!project) return;

    // Find or create a system donor record
    const systemDonor = await this.prisma.user.findFirst({
      where: { email: 'system@stellaraid.internal' },
    });
    if (!systemDonor) return;

    const amount = parseFloat(record.amount);

    await this.prisma.$transaction(async (tx: any) => {
      await tx.donation.create({
        data: {
          projectId: project.id,
          donorId: systemDonor.id,
          amount,
          assetType: record.asset_type === 'native' ? 'XLM' : record.asset_code,
          assetCode: record.asset_type === 'native' ? 'XLM' : record.asset_code,
          assetIssuer: record.asset_issuer ?? null,
          transactionHash: txHash,
          status: 'COMPLETED',
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: { raisedAmount: { increment: amount } },
      });
    });

    this.logger.log(`Stored donation from tx ${txHash} for project ${project.id}`);
  }
}
