/**
 * CampaignStats interface — returned by GET /campaigns/:id/stats
 *
 * Contains aggregated fundraising metrics for a single campaign.
 * Fields are computed from confirmed donations at query time.
 */
export interface CampaignStats {
  /** Campaign UUID */
  campaignId: string;

  /** Total amount raised from all confirmed donations */
  totalRaised: number;

  /** Campaign's fundraising goal amount */
  goalAmount: number;

  /**
   * Progress towards the goal as a percentage (0–100).
   * Capped at 100 even when totalRaised exceeds goalAmount.
   */
  progressPercentage: number;

  /** Number of unique donors */
  donorCount: number;

  /** Asset codes accepted for this campaign (e.g. ['XLM', 'USDC']) */
  uniqueAssets: string[];

  /** Average donation amount across all confirmed donations */
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
