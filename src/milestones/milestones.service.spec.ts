import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { MilestonesService } from './milestones.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MilestonesService', () => {
  let service: MilestonesService;
  let prisma: {
    $transaction: jest.Mock;
    $queryRaw: jest.Mock;
    campaign: { findUnique: jest.Mock };
    milestone: { findUnique: jest.Mock };
    donation: { aggregate: jest.Mock };
    fundRelease: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      groupBy: jest.Mock;
      aggregate: jest.Mock;
    };
  };

  const CREATOR_ID = 'creator-1';
  const OTHER_ID = 'someone-else';
  const CAMPAIGN_ID = 'campaign-1';
  const MILESTONE_ID = 'milestone-1';
  const RELEASE_ID = 'release-1';

  const campaign = { id: CAMPAIGN_ID, creatorId: CREATOR_ID };
  const milestone = {
    id: MILESTONE_ID,
    campaignId: CAMPAIGN_ID,
    status: 'UNLOCKED',
    targetAmount: { toString: () => '1000' },
  };

  const baseRelease = {
    id: RELEASE_ID,
    milestoneId: MILESTONE_ID,
    campaignId: CAMPAIGN_ID,
    creatorId: CREATOR_ID,
    amount: { toString: () => '500' },
    status: 'PENDING',
    txHash: null,
    releaseReason: null,
    approvedAt: null,
    releasedAt: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  };

  beforeEach(async () => {
    prisma = {
      // The interactive transaction runs its callback with the mock itself as
      // `tx`, so every `tx.<model>.<op>` resolves to the matching mock below.
      $transaction: jest.fn(async (fn: (tx: unknown) => Promise<unknown>) =>
        fn(prisma),
      ),
      // `SELECT ... FOR UPDATE` returns the locked campaign row.
      $queryRaw: jest
        .fn()
        .mockResolvedValue([{ id: CAMPAIGN_ID, creatorId: CREATOR_ID }]),
      campaign: { findUnique: jest.fn().mockResolvedValue(campaign) },
      milestone: { findUnique: jest.fn().mockResolvedValue(milestone) },
      donation: {
        aggregate: jest
          .fn()
          .mockResolvedValue({ _sum: { amount: { toString: () => '1000' } } }),
      },
      fundRelease: {
        findFirst: jest.fn().mockResolvedValue(null),
        findUnique: jest.fn().mockResolvedValue(baseRelease),
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue(baseRelease),
        update: jest
          .fn()
          .mockResolvedValue({ ...baseRelease, status: 'CANCELLED' }),
        groupBy: jest.fn().mockResolvedValue([]),
        aggregate: jest.fn().mockResolvedValue({ _sum: { amount: null } }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MilestonesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<MilestonesService>(MilestonesService);
  });

  describe('requestFundRelease', () => {
    const dto = { amount: '500' } as any;

    it('creates a PENDING fund release for the campaign creator', async () => {
      const result = await service.requestFundRelease(
        CAMPAIGN_ID,
        MILESTONE_ID,
        CREATOR_ID,
        dto,
      );

      expect(result.status).toBe('PENDING');
      expect(result.amount).toBe('500');
      expect(prisma.fundRelease.create).toHaveBeenCalledTimes(1);
      // Available funds must be recomputed from CONFIRMED donations only.
      expect(prisma.donation.aggregate).toHaveBeenCalledWith({
        where: { campaignId: CAMPAIGN_ID, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
    });

    it('throws NotFoundException when the campaign is missing', async () => {
      prisma.$queryRaw.mockResolvedValueOnce([]);
      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException when caller is not the creator', async () => {
      // Locked campaign is owned by CREATOR_ID, but the caller is OTHER_ID.
      prisma.$queryRaw.mockResolvedValueOnce([
        { id: CAMPAIGN_ID, creatorId: CREATOR_ID },
      ]);
      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, OTHER_ID, dto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when the milestone is not UNLOCKED', async () => {
      prisma.milestone.findUnique.mockResolvedValueOnce({
        ...milestone,
        status: 'PENDING',
      });
      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when amount exceeds the milestone target', async () => {
      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, {
          amount: '5000',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects when a PENDING release already exists', async () => {
      prisma.fundRelease.findFirst.mockResolvedValueOnce(baseRelease);
      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.fundRelease.create).not.toHaveBeenCalled();
    });

    it('rejects when the request plus outstanding releases exceeds confirmed raised', async () => {
      // Campaign has 1000 confirmed raised; another milestone already has a
      // 700 PENDING release reserved, leaving only 300 available for a 500 ask.
      prisma.fundRelease.aggregate.mockResolvedValueOnce({
        _sum: { amount: { toString: () => '700' } },
      });

      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.fundRelease.create).not.toHaveBeenCalled();
    });

    it('derives available funds from CONFIRMED donations, not campaign.raisedAmount', async () => {
      // Only 300 in CONFIRMED donations, so a 500 ask is rejected even though
      // the milestone target (1000) would allow it.
      prisma.donation.aggregate.mockResolvedValueOnce({
        _sum: { amount: { toString: () => '300' } },
      });

      await expect(
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(prisma.donation.aggregate).toHaveBeenCalledWith({
        where: { campaignId: CAMPAIGN_ID, status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      // The denormalised raisedAmount is never consulted.
      expect(prisma.campaign.findUnique).not.toHaveBeenCalled();
    });

    it('returns a clean error when a concurrent duplicate hits the unique index', async () => {
      // Simulate the race: both requests pass the findFirst guard, but the DB
      // partial unique index rejects the second create with P2002. Exactly one
      // pending release is created; the loser fails cleanly (400, not a raw
      // Prisma error).
      prisma.fundRelease.findFirst.mockResolvedValue(null);
      prisma.fundRelease.create
        .mockResolvedValueOnce(baseRelease)
        .mockRejectedValueOnce(
          new Prisma.PrismaClientKnownRequestError('unique violation', {
            code: 'P2002',
            clientVersion: '6.19.3',
          }),
        );

      const results = await Promise.allSettled([
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
        service.requestFundRelease(CAMPAIGN_ID, MILESTONE_ID, CREATOR_ID, dto),
      ]);

      expect(prisma.fundRelease.create).toHaveBeenCalledTimes(2);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');
      const rejected = results.filter((r) => r.status === 'rejected');
      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const reason = rejected[0].reason;
      expect(reason).toBeInstanceOf(BadRequestException);
      expect(reason.message).toBe(
        'There is already a pending fund release for this milestone',
      );
    });
  });

  describe('cancelFundRelease', () => {
    it('cancels a PENDING release for its creator', async () => {
      const result = await service.cancelFundRelease(RELEASE_ID, CREATOR_ID);
      expect(result.status).toBe('CANCELLED');
      expect(prisma.fundRelease.update).toHaveBeenCalledWith({
        where: { id: RELEASE_ID },
        data: { status: 'CANCELLED' },
      });
    });

    it('throws NotFoundException when the release is missing', async () => {
      prisma.fundRelease.findUnique.mockResolvedValueOnce(null);
      await expect(
        service.cancelFundRelease(RELEASE_ID, CREATOR_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws ForbiddenException for a non-creator', async () => {
      await expect(
        service.cancelFundRelease(RELEASE_ID, OTHER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('throws BadRequestException when the release is not PENDING', async () => {
      prisma.fundRelease.findUnique.mockResolvedValueOnce({
        ...baseRelease,
        status: 'RELEASED',
      });
      await expect(
        service.cancelFundRelease(RELEASE_ID, CREATOR_ID),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('getFundReleaseById', () => {
    it('returns the release with campaign title', async () => {
      prisma.fundRelease.findUnique.mockResolvedValueOnce({
        ...baseRelease,
        campaign: { id: CAMPAIGN_ID, title: 'My Campaign' },
      });
      const result = await service.getFundReleaseById(RELEASE_ID, CREATOR_ID);
      expect(result.campaignTitle).toBe('My Campaign');
    });

    it('throws ForbiddenException when a different user requests it', async () => {
      prisma.fundRelease.findUnique.mockResolvedValueOnce({
        ...baseRelease,
        campaign: { id: CAMPAIGN_ID, title: 'My Campaign' },
      });
      await expect(
        service.getFundReleaseById(RELEASE_ID, OTHER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getCampaignFundReleaseStats', () => {
    it('aggregates counts and sums grouped by status', async () => {
      prisma.fundRelease.groupBy.mockResolvedValueOnce([
        {
          status: 'PENDING',
          _count: 2,
          _sum: { amount: { toString: () => '300' } },
        },
        {
          status: 'RELEASED',
          _count: 1,
          _sum: { amount: { toString: () => '700' } },
        },
      ]);

      const result = await service.getCampaignFundReleaseStats(CAMPAIGN_ID);

      expect(result.total).toBe(3);
      expect(result.pending).toEqual({ count: 2, amount: '300' });
      expect(result.released).toEqual({ count: 1, amount: '700' });
    });
  });
});
