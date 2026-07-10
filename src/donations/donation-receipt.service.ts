import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface DonationReceipt {
  receiptNumber: string;
  issuedAt: string;
  donor: {
    id: string;
    displayName: string;
    walletAddress: string;
  };
  campaign: {
    id: string;
    title: string;
  };
  donation: {
    id: string;
    amount: string;
    assetCode: string;
    txHash: string;
    status: string;
    donatedAt: string;
  };
  platform: string;
}

@Injectable()
export class DonationReceiptService {
  private readonly logger = new Logger(DonationReceiptService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Generate a donation receipt for a confirmed donation.
   *
   * The receipt number is deterministic: `REC-<donationId prefix>-<timestamp date>`,
   * ensuring idempotent re-generation for the same donation.
   *
   * @param donationId  UUID of the donation
   * @param requesterId The user requesting the receipt (must be the donor)
   */
  async generateReceipt(
    donationId: string,
    requesterId: string,
  ): Promise<DonationReceipt> {
    const donation = await this.prisma.donation.findUnique({
      where: { id: donationId },
      include: {
        donor: {
          select: {
            id: true,
            displayName: true,
            walletAddress: true,
          },
        },
        campaign: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!donation) {
      throw new NotFoundException(`Donation ${donationId} not found`);
    }

    if (donation.donorId !== requesterId) {
      throw new NotFoundException(`Donation ${donationId} not found`);
    }

    if (donation.status !== 'CONFIRMED') {
      throw new NotFoundException(
        `Receipt can only be generated for CONFIRMED donations. Current status: ${donation.status}`,
      );
    }

    const dateStr = donation.donatedAt
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const receiptNumber = `REC-${donation.id.slice(0, 8).toUpperCase()}-${dateStr}`;

    this.logger.log(
      `Generated receipt ${receiptNumber} for donation ${donationId}`,
    );

    return {
      receiptNumber,
      issuedAt: new Date().toISOString(),
      donor: {
        id: donation.donor.id,
        displayName: donation.donor.displayName ?? donation.donor.walletAddress,
        walletAddress: donation.donor.walletAddress,
      },
      campaign: {
        id: donation.campaign.id,
        title: donation.campaign.title,
      },
      donation: {
        id: donation.id,
        amount: donation.amount.toString(),
        assetCode: donation.assetCode,
        txHash: donation.txHash,
        status: donation.status,
        donatedAt: donation.donatedAt.toISOString(),
      },
      platform: 'MilestoneX',
    };
  }
}
