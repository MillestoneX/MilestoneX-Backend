import { Test, TestingModule } from '@nestjs/testing';
import { CampaignsService } from './campaigns.service';
import { PrismaService } from '../prisma/prisma.service';
import { StellarTransactionsService } from '../stellar/stellar-transactions.service';

const USDC_ISSUER = 'ISSUER';

const mockPrisma = {
  campaign: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  donation: {
    findMany: jest.fn(),
    groupBy: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockStellarTxs = {
  getContractBalances: jest.fn(),
};

describe('CampaignsService – multi-asset raised totals', () => {
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

  describe('recalculateCampaignStats', () => {
    it('does not report 100 XLM + 50 USDC as raisedAmount = 150', async () => {
      const update = jest.fn().mockResolvedValue({});
      mockPrisma.$transaction.mockImplementation(async (fn: any) =>
        fn({
          donation: {
            groupBy: jest.fn().mockResolvedValue([
              {
                assetCode: 'XLM',
                assetIssuer: null,
                _sum: { amount: '100' },
              },
              {
                assetCode: 'USDC',
                assetIssuer: USDC_ISSUER,
                _sum: { amount: '50' },
              },
            ]),
          },
          campaign: { update },
        }),
      );

      await service.recalculateCampaignStats('c1');

      expect(update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          raisedAmount: '100',
          raisedByAsset: { XLM: '100', [`USDC:${USDC_ISSUER}`]: '50' },
        },
      });
    });
  });

  describe('getContractBalance', () => {
    it('reports the two balances separately and never overwrites stored totals', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: 'c1',
        contractId: 'contract-1',
        raisedByAsset: { XLM: '100', [`USDC:${USDC_ISSUER}`]: '50' },
      });
      mockStellarTxs.getContractBalances.mockResolvedValue([
        { assetCode: 'XLM', balance: '100', isNative: true },
        {
          assetCode: 'USDC',
          assetIssuer: USDC_ISSUER,
          balance: '50',
          isNative: false,
        },
      ]);

      const result = await service.getContractBalance('c1');

      expect(result.balances).toHaveLength(2);
      expect(result.balances[0]).toMatchObject({
        assetCode: 'XLM',
        balance: '100',
      });
      expect(result.balances[1]).toMatchObject({
        assetCode: 'USDC',
        balance: '50',
      });
      expect(result.storedRaisedByAsset).toEqual({
        XLM: '100',
        [`USDC:${USDC_ISSUER}`]: '50',
      });
      // The write-back side effect is gone.
      expect(mockPrisma.campaign.update).not.toHaveBeenCalled();
    });
  });

  describe('getCampaignStats', () => {
    it('reports a native-XLM scalar and a per-asset breakdown, not a mixed sum', async () => {
      mockPrisma.campaign.findUnique.mockResolvedValue({
        id: 'c1',
        goalAmount: '1000',
        raisedAmount: '100',
      });
      mockPrisma.donation.findMany.mockResolvedValue([
        { amount: '100', donorId: 'u1', assetCode: 'XLM', assetIssuer: null },
        {
          amount: '50',
          donorId: 'u2',
          assetCode: 'USDC',
          assetIssuer: USDC_ISSUER,
        },
      ]);

      const result = await service.getCampaignStats('c1');

      expect(result.totalRaised).toBe(100);
      expect(result.raisedByAsset).toEqual({
        XLM: '100',
        [`USDC:${USDC_ISSUER}`]: '50',
      });
      expect(result.progressPercentage).toBe(10);
    });
  });
});
