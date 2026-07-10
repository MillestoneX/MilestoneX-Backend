import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DonationsService } from './donations.service';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignsService } from '../campaigns/campaigns.service';
import { StellarTransactionsService } from '../stellar/stellar-transactions.service';

const mockPrisma = {
  donation: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
  },
  campaign: {
    findUnique: jest.fn(),
  },
  platformTip: {
    findUnique: jest.fn(),
    update: jest.fn(),
    aggregate: jest.fn(),
    findMany: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

const mockCampaignsService = {
  recalculateCampaignStats: jest.fn(),
};

const mockStellarTxs = {
  verifyDonationTransaction: jest.fn(),
};

describe('DonationsService – createDonation', () => {
  let service: DonationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CampaignsService, useValue: mockCampaignsService },
        { provide: StellarTransactionsService, useValue: mockStellarTxs },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
    jest.clearAllMocks();
  });

  it('throws BadRequestException when walletAddress is empty', async () => {
    await expect(
      service.createDonation('', { txHash: 'abc', campaignId: 'c1', amount: '10' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when txHash is missing', async () => {
    await expect(
      service.createDonation('GADDR', { campaignId: 'c1', amount: '10' } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('returns cached donation when txHash already exists as CONFIRMED', async () => {
    const existingDonation = {
      id: 'd1',
      amount: { toString: () => '10' },
      assetCode: 'XLM',
      txHash: 'tx123',
      status: 'CONFIRMED',
      donorId: 'u1',
      campaignId: 'c1',
      tipAmount: null,
      tipAsset: null,
      tipId: null,
      donatedAt: new Date(),
      confirmedAt: new Date(),
      createdAt: new Date(),
    };
    mockPrisma.donation.findUnique.mockResolvedValue(existingDonation);

    const result = await service.createDonation('GADDR', {
      txHash: 'tx123',
      campaignId: 'c1',
      amount: '10',
    } as any);

    expect(result.donation.id).toBe('d1');
    expect(result.donation.recovered).toBe(false);
    expect(mockStellarTxs.verifyDonationTransaction).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when campaign does not exist', async () => {
    mockPrisma.donation.findUnique.mockResolvedValue(null);
    mockPrisma.campaign.findUnique.mockResolvedValue(null);

    await expect(
      service.createDonation('GADDR', {
        txHash: 'newtx',
        campaignId: 'nonexistent',
        amount: '10',
      } as any),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException when campaign has no contractId', async () => {
    mockPrisma.donation.findUnique.mockResolvedValue(null);
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      contractId: null,
      acceptedAssets: [],
    });

    await expect(
      service.createDonation('GADDR', {
        txHash: 'newtx',
        campaignId: 'c1',
        amount: '10',
      } as any),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates donation after successful on-chain verification', async () => {
    mockPrisma.donation.findUnique.mockResolvedValue(null);
    mockPrisma.campaign.findUnique.mockResolvedValue({
      id: 'c1',
      contractId: 'CONTRACT123',
      acceptedAssets: [{ assetType: 'native' }],
    });
    mockStellarTxs.verifyDonationTransaction.mockResolvedValue({});
    mockPrisma.user.findUnique.mockResolvedValue({ id: 'u1', walletAddress: 'GADDR' });
    const createdDonation = {
      id: 'new_d1',
      amount: { toString: () => '10' },
      assetCode: 'XLM',
      txHash: 'newtx',
      status: 'CONFIRMED',
      donorId: 'u1',
      campaignId: 'c1',
      tipAmount: null,
      tipAsset: null,
      tipId: null,
      donatedAt: new Date(),
      confirmedAt: new Date(),
      createdAt: new Date(),
    };
    mockPrisma.donation.create.mockResolvedValue(createdDonation);
    mockCampaignsService.recalculateCampaignStats.mockResolvedValue(undefined);

    const result = await service.createDonation('GADDR', {
      txHash: 'newtx',
      campaignId: 'c1',
      amount: '10',
    } as any);

    expect(result.donation.id).toBe('new_d1');
    expect(result.donation.status).toBe('CONFIRMED');
    expect(mockCampaignsService.recalculateCampaignStats).toHaveBeenCalledWith('c1');
  });
});
