/**
 * CampaignStats interface — returned by GET /campaigns/:id/stats
 *
 * Contains aggregated fundraising metrics for a single campaign.
 * Fields are computed from confirmed donations at query time.
 *
 * Multi-asset campaigns are represented per asset: `raisedByAsset` holds the
 * full breakdown keyed by `XLM` (native) or `CODE:ISSUER` (issued assets),
 * while the scalar `totalRaised` / `progressPercentage` fields are expressed
 * in the single well-defined base unit, native XLM. Heterogeneous assets are
 * never summed into one number.
 */
export interface CampaignStats {
  /** Campaign UUID */
  campaignId: string;

  /**
   * Total raised in the base asset (native XLM). Use `raisedByAsset` for the
   * full per-asset breakdown.
   */
  totalRaised: number;

  /**
   * Per-asset raised totals. Keys are `XLM` for native XLM and `CODE:ISSUER`
   * for issued assets; values are decimal strings.
   */
  raisedByAsset: Record<string, string>;

  /** Campaign's fundraising goal amount (denominated in native XLM) */
  goalAmount: number;

  /**
   * Progress towards the goal as a percentage (0–100) of the native-XLM
   * raised total. Capped at 100 even when totalRaised exceeds goalAmount.
   */
  progressPercentage: number;

  /** Number of unique donors */
  donorCount: number;

  /** Asset codes donated to this campaign (e.g. ['XLM', 'USDC']) */
  uniqueAssets: string[];

  /** Average native-XLM donation amount across native-XLM donations */
  avgDonation: number;

  /** Daily donation totals (populated for detailed analytics views) */
  donationsPerDay: DonationPerDay[];

  /** Top donors by total donated amount */
  topDonors: TopDonor[];
}

/** Daily donation aggregation entry */
export interface DonationPerDay {
  date: string; // ISO date string e.g. '2026-01-15'
  total: number;
  count: number;
}

/** Top donor summary */
export interface TopDonor {
  walletAddress: string;
  totalDonated: number;
  donationCount: number;
}
