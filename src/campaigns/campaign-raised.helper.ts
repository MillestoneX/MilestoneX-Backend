import { Prisma } from '@prisma/client';

/**
 * The native Stellar asset code. `Campaign.raisedAmount` is denominated in
 * native XLM only — the "base asset" — because it is the single well-defined
 * unit available without an exchange-rate source. Every other asset is kept
 * separately in `Campaign.raisedByAsset`.
 */
export const NATIVE_ASSET_CODE = 'XLM';

/** A single per-asset amount read from a donation aggregate. */
export interface AssetAmountRow {
  assetCode: string;
  assetIssuer?: string | null;
  amount: Prisma.Decimal | string | number;
}

/**
 * Encode an asset as the key used in `Campaign.raisedByAsset`.
 *
 * Native XLM collapses to `XLM`; issued assets become `CODE:ISSUER` where the
 * code is upper-cased and the issuer is preserved verbatim (Stellar account
 * IDs are case-sensitive).
 */
export function assetKey(
  assetCode: string,
  assetIssuer?: string | null,
): string {
  const code = String(assetCode ?? '').trim().toUpperCase();
  if (code === NATIVE_ASSET_CODE) return NATIVE_ASSET_CODE;
  return `${code}:${String(assetIssuer ?? '')}`;
}

/**
 * Sum per-asset amount rows into a `raisedByAsset` map of decimal strings.
 * Amounts are accumulated as `Prisma.Decimal` so precision is preserved.
 */
export function buildRaisedByAsset(
  rows: AssetAmountRow[],
): Record<string, string> {
  const totals: Record<string, Prisma.Decimal> = {};

  for (const row of rows) {
    const key = assetKey(row.assetCode, row.assetIssuer);
    const amount = new Prisma.Decimal(row.amount ?? 0);
    totals[key] = totals[key] ? totals[key].add(amount) : amount;
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(totals)) {
    result[key] = value.toString();
  }
  return result;
}

/**
 * Return the native-XLM portion of a `raisedByAsset` map as a decimal string.
 * This is the well-defined single-unit summary written to `raisedAmount`.
 */
export function nativeRaisedAmount(
  raisedByAsset: Record<string, string> | null | undefined,
): string {
  return raisedByAsset?.[NATIVE_ASSET_CODE] ?? '0';
}

/**
 * Recompute a campaign's `raisedByAsset` breakdown and native-XLM
 * `raisedAmount` from its confirmed donations, atomically within the supplied
 * transaction. This is the single source of truth for campaign raised totals;
 * callers that already hold a transaction (e.g. refunds) can invoke it with
 * `tx` rather than opening a nested transaction.
 */
export async function recalculateCampaignRaised(
  tx: Prisma.TransactionClient,
  campaignId: string,
): Promise<void> {
  const groups = await tx.donation.groupBy({
    by: ['assetCode', 'assetIssuer'],
    where: { campaignId, status: 'CONFIRMED' },
    _sum: { amount: true },
  });

  const raisedByAsset = buildRaisedByAsset(
    groups.map((g) => ({
      assetCode: g.assetCode,
      assetIssuer: g.assetIssuer,
      amount: g._sum.amount ?? new Prisma.Decimal(0),
    })),
  );

  await tx.campaign.update({
    where: { id: campaignId },
    data: {
      raisedAmount: nativeRaisedAmount(raisedByAsset),
      raisedByAsset,
    },
  });
}
