import { Prisma } from '@prisma/client';
import {
  assetKey,
  buildRaisedByAsset,
  nativeRaisedAmount,
  recalculateCampaignRaised,
} from './campaign-raised.helper';

describe('campaign-raised helpers', () => {
  describe('assetKey', () => {
    it('collapses native XLM (any case) to "XLM"', () => {
      expect(assetKey('XLM', null)).toBe('XLM');
      expect(assetKey('xlm', undefined)).toBe('XLM');
    });

    it('encodes issued assets as CODE:ISSUER', () => {
      expect(assetKey('usdc', 'ISSUER')).toBe('USDC:ISSUER');
    });
  });

  describe('buildRaisedByAsset', () => {
    it('sums per asset and never merges heterogeneous assets', () => {
      const result = buildRaisedByAsset([
        {
          assetCode: 'XLM',
          assetIssuer: null,
          amount: new Prisma.Decimal('100'),
        },
        {
          assetCode: 'USDC',
          assetIssuer: 'ISSUER',
          amount: new Prisma.Decimal('50'),
        },
        {
          assetCode: 'XLM',
          assetIssuer: null,
          amount: new Prisma.Decimal('25'),
        },
      ]);

      expect(result).toEqual({
        XLM: '125',
        'USDC:ISSUER': '50',
      });
    });

    it('returns an empty map for no rows', () => {
      expect(buildRaisedByAsset([])).toEqual({});
    });
  });

  describe('nativeRaisedAmount', () => {
    it('returns the native-XLM portion, or 0 when absent', () => {
      expect(nativeRaisedAmount({ XLM: '100', 'USDC:ISSUER': '50' })).toBe(
        '100',
      );
      expect(nativeRaisedAmount({})).toBe('0');
      expect(nativeRaisedAmount(null)).toBe('0');
      expect(nativeRaisedAmount(undefined)).toBe('0');
    });
  });

  describe('recalculateCampaignRaised', () => {
    it('writes per-asset totals and an XLM-only raisedAmount (never a mixed scalar)', async () => {
      const groupBy = jest.fn().mockResolvedValue([
        {
          assetCode: 'XLM',
          assetIssuer: null,
          _sum: { amount: new Prisma.Decimal('100') },
        },
        {
          assetCode: 'USDC',
          assetIssuer: 'ISSUER',
          _sum: { amount: new Prisma.Decimal('50') },
        },
      ]);
      const update = jest.fn().mockResolvedValue({});
      const tx = { donation: { groupBy }, campaign: { update } } as any;

      await recalculateCampaignRaised(tx, 'c1');

      expect(groupBy).toHaveBeenCalledWith({
        by: ['assetCode', 'assetIssuer'],
        where: { campaignId: 'c1', status: 'CONFIRMED' },
        _sum: { amount: true },
      });
      expect(update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: {
          raisedAmount: '100',
          raisedByAsset: { XLM: '100', 'USDC:ISSUER': '50' },
        },
      });
    });
  });
});
