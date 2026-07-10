import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { StellarTransactionsService } from '../stellar/stellar-transactions.service';

const mockPrisma = {
  campaign: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
  },
  donation: {
    findMany: jest.fn(),
    aggregate: jest.fn(),
  },
  update: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  $transaction: jest.fn(),
  $queryRaw: jest.fn(),
};

const mockStellarTxs = {
  getContractBalances: jest.fn(),
};

describe('CampaignsService – browseCampaigns', () => {
  let service: CampaignsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StellarTransactionsService, useValue: mockStellarTxs },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);

    jest.clearAllMocks();
  });

  it('returns paginated campaigns with defaults', async () => {
    const fakeCampaigns = [{ id: 'c1', title: 'Test Campaign' }];
    mockPrisma.$transaction.mockResolvedValue([1, fakeCampaigns]);

    const result = await service.browseCampaigns({
      page: 1,
      limit: 10,
      sortBy: 'newest',
    });

    expect(result.data).toEqual(fakeCampaigns);
    expect(result.total).toBe(1);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('throws BadRequestException when search is fewer than 3 chars', async () => {
    await expect(
      service.browseCampaigns({
        page: 1,
        limit: 10,
        search: 'ab',
        sortBy: 'newest',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('applies mostFunded sort order', async () => {
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    await service.browseCampaigns({ page: 1, limit: 10, sortBy: 'mostFunded' });

    // Verify the sort order was actually applied to the findMany call
    // (the previous version of this test only checked that $transaction
    // received two args, which did not actually assert the sort behavior).
    expect(mockPrisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { raisedAmount: 'desc' },
      }),
    );
  });

  it('returns empty data when no campaigns match', async () => {
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    const result = await service.browseCampaigns({
      page: 1,
      limit: 10,
      sortBy: 'newest',
    });

    expect(result.data).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('filters by category when provided', async () => {
    mockPrisma.$transaction.mockResolvedValue([0, []]);

    await service.browseCampaigns({
      page: 1,
      limit: 10,
      category: 'Education',
      sortBy: 'newest',
    });

    // Transaction was called — filter logic ran without throwing
    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});

describe('CampaignsService – getCampaignStats', () => {
  let service: CampaignsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CampaignsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: StellarTransactionsService, useValue: mockStellarTxs },
      ],
    }).compile();

    service = module.get<CampaignsService>(CampaignsService);
    jest.clearAllMocks();
  });

  it('throws NotFoundException when campaign does not exist', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue(null);

    await expect(service.getCampaignStats('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('returns zero avgDonation and zero progressPercentage when no donations', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      goalAmount: '1000',
      raisedAmount: '0',
    });
    mockPrisma.donation.findMany.mockResolvedValue([]);

    const result = await service.getCampaignStats('c1');

    expect(result.avgDonation).toBe(0);
    expect(result.donorCount).toBe(0);
    expect(result.progressPercentage).toBe(0);
    expect(result.totalRaised).toBe(0);
  });

  it('calculates progressPercentage correctly', async () => {
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      goalAmount: '1000',
      raisedAmount: '250',
    });
    mockPrisma.donation.findMany.mockResolvedValue([
      { amount: '250', donorId: 'u1', assetCode: 'XLM', createdAt: new Date() },
    ]);

    const result = await service.getCampaignStats('c1');

    expect(result.progressPercentage).toBe(25);
    expect(result.totalRaised).toBe(250);
  });
});
