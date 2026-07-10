import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { QUEUE_EXPORT } from '../queue/queue.constants';

const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  donation: {
    findMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  campaign: {
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  notificationPreference: {
    upsert: jest.fn(),
  },
  campaignBookmark: {
    count: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockExportQueue = {
  add: jest.fn(),
  getJob: jest.fn(),
};

describe('UsersService – exportUserDonationsAsCSV', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_EXPORT), useValue: mockExportQueue },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('returns CSV inline for small datasets (≤ 500 rows)', async () => {
    mockPrisma.donation.count.mockResolvedValue(5);
    mockPrisma.donation.findMany.mockResolvedValue([
      {
        id: 'd1',
        amount: { toString: () => '10' },
        assetCode: 'XLM',
        donatedAt: new Date('2026-01-01'),
        txHash: 'tx1',
        campaign: { title: 'Test Campaign' },
      },
    ]);

    const result = await service.exportUserDonationsAsCSV('u1');

    expect(result.queued).toBe(false);
    expect(result.csv).toBeDefined();
    expect(result.csv).toContain('Test Campaign');
    expect(result.jobId).toBeUndefined();
  });

  it('enqueues the job for large datasets (> 500 rows)', async () => {
    mockPrisma.donation.count.mockResolvedValue(501);
    mockExportQueue.add.mockResolvedValue({ id: 'job-42' });

    const result = await service.exportUserDonationsAsCSV('u1');

    expect(result.queued).toBe(true);
    expect(result.jobId).toBe('job-42');
    expect(result.csv).toBeUndefined();
    expect(mockExportQueue.add).toHaveBeenCalledWith(
      'donation-export',
      expect.objectContaining({ userId: 'u1' }),
    );
  });

  it('applies campaignId filter when provided', async () => {
    mockPrisma.donation.count.mockResolvedValue(0);
    mockPrisma.donation.findMany.mockResolvedValue([]);

    await service.exportUserDonationsAsCSV('u1', 'campaign-abc');

    expect(mockPrisma.donation.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ campaignId: 'campaign-abc' }),
      }),
    );
  });

  it('applies date range filters when provided', async () => {
    mockPrisma.donation.count.mockResolvedValue(0);
    mockPrisma.donation.findMany.mockResolvedValue([]);

    await service.exportUserDonationsAsCSV(
      'u1',
      undefined,
      '2026-01-01',
      '2026-06-30',
    );

    expect(mockPrisma.donation.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          donatedAt: {
            gte: new Date('2026-01-01'),
            lte: new Date('2026-06-30'),
          },
        }),
      }),
    );
  });
});

describe('UsersService – getMyProfile', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_EXPORT), useValue: mockExportQueue },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when user does not exist', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(service.getMyProfile('GADDR_unknown')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns calculated totals in the profile', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      walletAddress: 'GADDR',
      displayName: 'Alice',
      bio: null,
      avatarUrl: null,
      role: 'USER',
      kycStatus: 'UNVERIFIED',
      createdAt: new Date(),
      updatedAt: new Date(),
      campaigns: [{ raisedAmount: { toString: () => '500' } }],
      donations: [{ amount: { toString: () => '100' } }],
    });

    const result = await service.getMyProfile('GADDR');

    expect(result.totalRaised).toBe(500);
    expect(result.totalDonated).toBe(100);
    expect(result.campaignCount).toBe(1);
  });
});
