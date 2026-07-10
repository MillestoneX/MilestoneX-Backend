import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EXPORT } from '../queue/queue.constants';
import { buildDonationCsv } from '../common/csv-export.helper';

export interface ExportDonationJobData {
  userId: string;
  campaignId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ExportDonationJobResult {
  csv: string;
  rowCount: number;
}

/** Bull queue processor that handles async CSV export of large donation histories */
@Processor(QUEUE_EXPORT)
export class ExportProcessor {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(private readonly prisma: PrismaService) {}

  @Process('donation-export')
  async handleDonationExport(
    job: Job<ExportDonationJobData>,
  ): Promise<ExportDonationJobResult> {
    const { userId, campaignId, startDate, endDate } = job.data;

    this.logger.log(
      `Processing donation export job=${job.id} for user=${userId}`,
    );

    if (!userId) {
      const msg = `Export job ${job.id} is missing userId`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    // Build where clause
    const where: Prisma.DonationWhereInput = {
      donorId: userId,
      status: 'CONFIRMED' as const,
    };

    if (campaignId) {
      where.campaignId = campaignId;
    }

    if (startDate || endDate) {
      where.donatedAt = {};
      if (startDate) {
        const parsed = new Date(startDate);
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid startDate: ${startDate}`);
        }
        where.donatedAt.gte = parsed;
      }
      if (endDate) {
        const parsed = new Date(endDate);
        if (isNaN(parsed.getTime())) {
          throw new Error(`Invalid endDate: ${endDate}`);
        }
        where.donatedAt.lte = parsed;
      }
    }

    let donations: Awaited<ReturnType<typeof this.prisma.donation.findMany>>;
    try {
      donations = await this.prisma.donation.findMany({
        where,
        include: {
          campaign: {
            select: { title: true },
          },
        },
        orderBy: { donatedAt: 'desc' },
      });
    } catch (err) {
      this.logger.error(
        `Failed to fetch donations for export job=${job.id}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    let csv: string;
    try {
      csv = buildDonationCsv(
        donations.map((d) => ({
          campaignTitle: (d as any).campaign?.title || 'Unknown',
          amount: d.amount.toString(),
          assetCode: d.assetCode,
          donatedAt: d.donatedAt,
          txHash: d.txHash,
        })),
      );
    } catch (err) {
      this.logger.error(
        `Failed to build CSV for export job=${job.id}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }

    this.logger.log(
      `Export job=${job.id} completed: user=${userId} rows=${donations.length}`,
    );

    return { csv, rowCount: donations.length };
  }
}
