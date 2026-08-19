import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { SuspendCampaignDto } from './dtos/suspend-campaign.dto';
import { recalculateCampaignRaised } from '../campaigns/campaign-raised.helper';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /** Suspend a campaign with an audit log entry and creator notification */
  async suspendCampaign(
    campaignId: string,
    dto: SuspendCampaignDto,
    adminId: string,
    adminEmail: string,
  ): Promise<{ message: string; notificationSent: boolean }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    if (campaign.status === 'CANCELLED') {
      throw new BadRequestException('Campaign is already suspended/cancelled');
    }

    const previousStatus = campaign.status;

    // Update campaign
    await this.prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'CANCELLED' },
    });

    // Write audit log
    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_ACTION',
        resourceType: 'campaign',
        resourceId: campaignId,
        details: JSON.stringify({
          reason: dto.reason,
          previousStatus,
          action: 'CAMPAIGN_SUSPENDED',
        }),
      },
    });

    // Notify creator - handle failures gracefully
    let notificationSent = true;
    try {
      await this.notificationsService.sendCampaignSuspensionEmail({
        creatorId: campaign.creatorId,
        campaignId,
        campaignTitle: campaign.title,
        reason: dto.reason,
      });
    } catch (error) {
      notificationSent = false;
      // Log the error but don't throw - campaign is already suspended
      console.error(
        `Failed to send suspension notification for campaign ${campaignId}:`,
        error,
      );
    }

    return {
      message: `Campaign ${campaignId} has been suspended`,
      notificationSent,
    };
  }

  /**
   * File a dispute against a donation.
   * Each donation may only have one open dispute at a time.
   */
  async fileDispute(
    filerId: string,
    dto: { donationId: string; reason: string; description: string },
  ) {
    const donation = await this.prisma.donation.findUnique({
      where: { id: dto.donationId },
      select: { id: true, campaignId: true, donorId: true },
    });
    if (!donation) {
      throw new NotFoundException('Donation not found');
    }

    const existing = await this.prisma.dispute.findUnique({
      where: { donationId: dto.donationId },
    });
    if (existing) {
      throw new BadRequestException(
        'A dispute already exists for this donation',
      );
    }

    return this.prisma.dispute.create({
      data: {
        donationId: dto.donationId,
        filerId,
        campaignId: donation.campaignId,
        reason: dto.reason,
        description: dto.description,
        status: 'OPENED',
      },
    });
  }

  /**
   * Resolve an open dispute (admin only).
   * Transitions status to RESOLVED and stamps resolvedAt.
   */
  async resolveDispute(disputeId: string, adminId: string, resolution: string) {
    const dispute = await this.prisma.dispute.findUnique({
      where: { id: disputeId },
    });
    if (!dispute) {
      throw new NotFoundException('Dispute not found');
    }
    if (dispute.status === 'RESOLVED' || dispute.status === 'REJECTED') {
      throw new BadRequestException(`Dispute is already ${dispute.status}`);
    }

    const updated = await this.prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: adminId,
        action: 'ADMIN_ACTION',
        resourceType: 'Dispute',
        resourceId: disputeId,
        details: JSON.stringify({ action: 'DISPUTE_RESOLVED', resolution }),
      },
    });

    return updated;
  }

  /**
   * Refund a confirmed donation and atomically recalculate the campaign's
   * raisedAmount within a single Prisma transaction.
   */
  async refundDonation(donationId: string): Promise<{
    id: string;
    amount: string;
    assetCode: string;
    status: string;
    campaignId: string;
    donorId: string;
    txHash: string | null;
    refundedAt: Date;
  }> {
    return this.prisma.$transaction(async (tx) => {
      const donation = await tx.donation.findUnique({
        where: { id: donationId },
      });

      if (!donation) {
        throw new NotFoundException('Donation not found');
      }

      if (donation.status !== 'CONFIRMED') {
        throw new BadRequestException(
          `Only confirmed donations can be refunded. Current status: ${donation.status}`,
        );
      }

      const updated = await tx.donation.update({
        where: { id: donationId },
        data: { status: 'REFUNDED' },
      });

      // Recalculate campaign raised totals (per asset) atomically within the
      // same transaction. Uses the shared asset-aware aggregation so refunds
      // never sum heterogeneous assets into a mixed-unit scalar.
      await recalculateCampaignRaised(tx, donation.campaignId);

      return {
        id: updated.id,
        amount: updated.amount.toString(),
        assetCode: updated.assetCode,
        status: updated.status,
        campaignId: updated.campaignId,
        donorId: updated.donorId,
        txHash: updated.txHash,
        refundedAt: updated.updatedAt,
      };
    });
  }
}
