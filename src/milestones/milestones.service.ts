import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RequestFundReleaseDto,
  FundReleaseResponseDto,
  FundReleaseDetailDto,
} from '../campaigns/dto/request-fund-release.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class MilestonesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Request fund release for an unlocked milestone.
   *
   * Only the campaign creator can request, and the milestone must be in
   * UNLOCKED status. The whole validation-and-create flow runs in one
   * interactive transaction that:
   *
   *   1. locks the campaign row (`SELECT ... FOR UPDATE`) so concurrent
   *      requests for the same campaign are serialised — this is what makes
   *      the funds-available check race-free, because the outstanding-release
   *      aggregate below always observes every already-committed release;
   *   2. recomputes the confirmed raised amount directly from CONFIRMED
   *      donations (REFUNDED/FAILED/PENDING donations are excluded) instead
   *      of trusting the denormalised `Campaign.raisedAmount`; and
   *   3. creates the PENDING release. A partial unique index on
   *      `fund_releases(milestoneId) WHERE status = 'PENDING'` backstops the
   *      one-pending-release-per-milestone invariant, and its P2002 violation
   *      is translated into a clean 400 instead of a raw DB error.
   */
  async requestFundRelease(
    campaignId: string,
    milestoneId: string,
    creatorId: string,
    dto: RequestFundReleaseDto,
  ): Promise<FundReleaseResponseDto> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // ── 1. Lock the campaign row and authorize the caller ──────
        const locked = await tx.$queryRaw<
          Array<{ id: string; creatorId: string }>
        >`
          SELECT id, "creatorId"
          FROM campaigns
          WHERE id = ${campaignId}
          FOR UPDATE
        `;

        const campaign = locked[0];
        if (!campaign) {
          throw new NotFoundException('Campaign not found');
        }

        if (campaign.creatorId !== creatorId) {
          throw new ForbiddenException(
            'Only campaign creator can request fund release',
          );
        }

        // ── 2. Milestone existence + status check ─────────────────
        const milestone = await tx.milestone.findUnique({
          where: { id: milestoneId },
        });

        if (!milestone) {
          throw new NotFoundException('Milestone not found');
        }

        if (milestone.campaignId !== campaignId) {
          throw new BadRequestException(
            'Milestone does not belong to this campaign',
          );
        }

        if (milestone.status !== 'UNLOCKED') {
          throw new BadRequestException(
            `Milestone must be in UNLOCKED status. Current status: ${milestone.status}`,
          );
        }

        // ── 3. Amount validation ──────────────────────────────────
        const releaseAmount = parseFloat(dto.amount);
        if (releaseAmount <= 0) {
          throw new BadRequestException(
            'Release amount must be greater than 0',
          );
        }

        if (releaseAmount > parseFloat(milestone.targetAmount.toString())) {
          throw new BadRequestException(
            `Release amount cannot exceed milestone target of ${milestone.targetAmount}`,
          );
        }

        // ── 4. Available funds = CONFIRMED donations − outstanding ─
        // Confirmed raised is recomputed from donations (not the denormalised
        // Campaign.raisedAmount) so REFUNDED/FAILED/PENDING donations never
        // count toward what can be released.
        const confirmedAgg = await tx.donation.aggregate({
          where: { campaignId, status: 'CONFIRMED' },
          _sum: { amount: true },
        });
        const confirmedRaised = parseFloat(
          confirmedAgg._sum.amount?.toString() ?? '0',
        );

        const outstandingAgg = await tx.fundRelease.aggregate({
          where: {
            campaignId,
            status: { in: ['PENDING', 'APPROVED'] },
          },
          _sum: { amount: true },
        });

        const outstandingTotal = parseFloat(
          outstandingAgg._sum.amount?.toString() ?? '0',
        );

        const availableFunds = confirmedRaised - outstandingTotal;

        if (releaseAmount > availableFunds) {
          throw new BadRequestException(
            `Release amount (${releaseAmount}) exceeds available campaign funds (${availableFunds}). ` +
              `Raised: ${confirmedRaised}, already reserved: ${outstandingTotal}`,
          );
        }

        // ── 5. Duplicate-pending guard ────────────────────────────
        const existingRelease = await tx.fundRelease.findFirst({
          where: {
            milestoneId,
            status: 'PENDING',
          },
        });

        if (existingRelease) {
          throw new BadRequestException(
            'There is already a pending fund release for this milestone',
          );
        }

        // ── 6. Create the release ─────────────────────────────────
        const fundRelease = await tx.fundRelease.create({
          data: {
            milestone: { connect: { id: milestoneId } },
            campaign: { connect: { id: campaignId } },
            creator: { connect: { id: creatorId } },
            amount: releaseAmount,
            status: 'PENDING',
            signaturePayload: dto.signaturePayload || null,
            releaseReason: dto.releaseReason || null,
          },
        });

        return {
          id: fundRelease.id,
          milestoneId: fundRelease.milestoneId,
          campaignId: fundRelease.campaignId,
          creatorId: fundRelease.creatorId,
          amount: fundRelease.amount.toString(),
          status: fundRelease.status,
          txHash: fundRelease.txHash,
          releaseReason: fundRelease.releaseReason,
          createdAt: fundRelease.createdAt,
          updatedAt: fundRelease.updatedAt,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(
          'There is already a pending fund release for this milestone',
        );
      }
      throw error;
    }
  }

  /**
   * Retrieve a single fund release record by ID.
   * Only the campaign creator or an admin may view it.
   */
  async getFundReleaseById(
    releaseId: string,
    requester: { userId: string; role: string },
  ): Promise<FundReleaseDetailDto> {
    const fundRelease = await this.prisma.fundRelease.findUnique({
      where: { id: releaseId },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
      },
    });

    if (!fundRelease) {
      throw new NotFoundException('Fund release not found');
    }

    const isCreator = fundRelease.creatorId === requester.userId;
    const isAdmin = requester.role === 'ADMIN';
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException('Not authorized to view this fund release');
    }

    return {
      id: fundRelease.id,
      milestoneId: fundRelease.milestoneId,
      campaignId: fundRelease.campaignId,
      campaignTitle: fundRelease.campaign?.title || 'Unknown',
      amount: fundRelease.amount.toString(),
      status: fundRelease.status,
      releaseReason: fundRelease.releaseReason,
      txHash: fundRelease.txHash,
      approvedAt: fundRelease.approvedAt,
      releasedAt: fundRelease.releasedAt,
      createdAt: fundRelease.createdAt,
    };
  }

  /**
   * List all fund releases for a campaign.
   * Non-admin users only see their own releases.
   */
  async getCampaignFundReleases(
    campaignId: string,
    requester: { userId: string; role: string },
  ) {
    const where: Prisma.FundReleaseWhereInput = {
      campaignId,
    };

    const isAdmin = requester.role === 'ADMIN';
    if (!isAdmin) {
      where.creatorId = requester.userId;
    }

    const fundReleases = await this.prisma.fundRelease.findMany({
      where,
      include: {
        campaign: {
          select: {
            title: true,
          },
        },
        milestone: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return fundReleases.map((release) => ({
      id: release.id,
      milestoneId: release.milestoneId,
      milestoneTitle: release.milestone?.title || 'Unknown',
      amount: release.amount.toString(),
      status: release.status,
      releaseReason: release.releaseReason,
      txHash: release.txHash,
      approvedAt: release.approvedAt,
      releasedAt: release.releasedAt,
      createdAt: release.createdAt,
    }));
  }

  /**
   * Aggregate fund release stats grouped by status for a campaign.
   * Only the campaign creator or an admin may view stats.
   */
  async getCampaignFundReleaseStats(
    campaignId: string,
    requester: { userId: string; role: string },
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { creatorId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const isCreator = campaign.creatorId === requester.userId;
    const isAdmin = requester.role === 'ADMIN';
    if (!isCreator && !isAdmin) {
      throw new ForbiddenException(
        'Not authorized to view fund release stats for this campaign',
      );
    }

    const stats = await this.prisma.fundRelease.groupBy({
      by: ['status'],
      where: { campaignId },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const result = {
      total: 0,
      pending: { count: 0, amount: '0' },
      approved: { count: 0, amount: '0' },
      released: { count: 0, amount: '0' },
      rejected: { count: 0, amount: '0' },
      cancelled: { count: 0, amount: '0' },
    };

    for (const stat of stats) {
      result.total += stat._count;
      const status = (
        stat.status as string
      ).toLowerCase() as keyof typeof result;
      const entry = result[status];
      if (entry && typeof entry !== 'number') {
        entry.count = stat._count ?? 0;
        entry.amount = stat._sum.amount?.toString() || '0';
      }
    }

    return result;
  }

  /** Validate dueDate is a valid future ISO date when provided */
  async validateMilestoneDueDate(dueDate?: string): Promise<void> {
    if (!dueDate) return;
    const date = new Date(dueDate);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(
        'Milestone dueDate must be a valid ISO date string',
      );
    }
    if (date <= new Date()) {
      throw new BadRequestException('Milestone due date must be in the future');
    }
  }

  /**
   * Mark a milestone as COMPLETED.
   * Only the campaign creator may complete a milestone.
   * Milestone must be in ACTIVE or UNLOCKED status.
   *
   * @param campaignId  The parent campaign UUID
   * @param milestoneId The milestone UUID to complete
   * @param creatorId   The requesting user UUID (must be campaign creator)
   * @param txHash      Optional on-chain transaction hash for proof
   */
  async completeMilestone(
    campaignId: string,
    milestoneId: string,
    creatorId: string,
    txHash?: string,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
    if (campaign.creatorId !== creatorId) {
      throw new ForbiddenException(
        'Only the campaign creator can complete milestones',
      );
    }

    const milestone = await this.prisma.milestone.findUnique({
      where: { id: milestoneId },
    });
    if (!milestone) {
      throw new NotFoundException('Milestone not found');
    }
    if (milestone.campaignId !== campaignId) {
      throw new BadRequestException(
        'Milestone does not belong to this campaign',
      );
    }
    if (!['ACTIVE', 'UNLOCKED'].includes(milestone.status)) {
      throw new BadRequestException(
        `Milestone must be ACTIVE or UNLOCKED to complete. Current status: ${milestone.status}`,
      );
    }

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        ...(txHash ? { txHash } : {}),
      },
    });
  }

  /**
   * Cancel a PENDING fund release. Only the original creator may cancel.
   */
  async cancelFundRelease(
    releaseId: string,
    userId: string,
  ): Promise<FundReleaseResponseDto> {
    const fundRelease = await this.prisma.fundRelease.findUnique({
      where: { id: releaseId },
    });

    if (!fundRelease) {
      throw new NotFoundException('Fund release not found');
    }

    if (fundRelease.creatorId !== userId) {
      throw new ForbiddenException(
        'Only the creator can cancel this fund release',
      );
    }

    if (fundRelease.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel fund release with status ${fundRelease.status}`,
      );
    }

    const updated = await this.prisma.fundRelease.update({
      where: { id: releaseId },
      data: {
        status: 'CANCELLED',
      },
    });

    return {
      id: updated.id,
      milestoneId: updated.milestoneId,
      campaignId: updated.campaignId,
      creatorId: updated.creatorId,
      amount: updated.amount.toString(),
      status: updated.status,
      txHash: updated.txHash,
      releaseReason: updated.releaseReason,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
