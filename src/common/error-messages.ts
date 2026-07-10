/**
 * Centralized error message constants.
 * Use these throughout the application instead of inline strings to ensure
 * consistent messaging and to simplify future i18n efforts.
 */

export const ERR = {
  // ─── Auth ────────────────────────────────────────────────────────────────
  INVALID_WALLET: 'Invalid wallet address',
  MISSING_CHALLENGE: 'Missing signedChallenge or challenge',
  SIGNATURE_FAILED: 'Signature verification failed',

  // ─── User ────────────────────────────────────────────────────────────────
  USER_NOT_FOUND: 'User not found',

  // ─── Campaign ────────────────────────────────────────────────────────────
  CAMPAIGN_NOT_FOUND: 'Campaign not found',
  CAMPAIGN_ALREADY_SUSPENDED: 'Campaign is already suspended/cancelled',
  CAMPAIGN_NO_CONTRACT: 'Campaign has no contractId set',
  CAMPAIGN_GOAL_INVALID: 'goalAmount is required and must be greater than 0',
  CAMPAIGN_END_DATE_PAST: 'Campaign end date must be in the future',
  CAMPAIGN_FORBIDDEN_FIELDS: (fields: string[]) =>
    `Cannot update protected fields: ${fields.join(', ')}`,
  CAMPAIGN_MAX_FEATURED: 'Maximum 6 featured campaigns allowed',
  CAMPAIGN_SEARCH_TOO_SHORT: 'Search must be at least 3 characters',

  // ─── Milestone ───────────────────────────────────────────────────────────
  MILESTONE_NOT_FOUND: 'Milestone not found',
  MILESTONE_WRONG_CAMPAIGN: 'Milestone does not belong to this campaign',
  MILESTONE_NOT_UNLOCKED: (status: string) =>
    `Milestone must be in UNLOCKED status. Current status: ${status}`,
  MILESTONE_PENDING_RELEASE: 'There is already a pending fund release for this milestone',
  MILESTONE_TARGET_AMOUNT_INVALID: (min: number) =>
    `milestone targetAmount is required and must be at least ${min}`,
  MILESTONE_DUE_DATE_PAST: 'Milestone due date must be in the future',

  // ─── Donation ────────────────────────────────────────────────────────────
  DONATION_NOT_FOUND: 'Donation not found',
  DONATION_MISSING_WALLET: 'Missing walletAddress in token',
  DONATION_MISSING_TX: 'txHash is required',
  DONATION_NOT_CONFIRMED: (status: string) =>
    `Only confirmed donations can be refunded. Current status: ${status}`,
  DONATION_ASSET_REQUIRED: 'assetCode is required',
  DONATION_ISSUER_REQUIRED: 'assetIssuer is required for non-native assets',

  // ─── Fund Release ─────────────────────────────────────────────────────────
  FUND_RELEASE_NOT_FOUND: 'Fund release not found',
  FUND_RELEASE_AMOUNT_ZERO: 'Release amount must be greater than 0',
  FUND_RELEASE_EXCEEDS_TARGET: (target: string) =>
    `Release amount cannot exceed milestone target of ${target}`,
  FUND_RELEASE_CANCEL_INVALID: (status: string) =>
    `Cannot cancel fund release with status ${status}`,
  FUND_RELEASE_NOT_CREATOR: 'Only the creator can cancel this fund release',
  FUND_RELEASE_EXCEEDS_AVAILABLE: 'Release amount exceeds available campaign funds',

  // ─── Dispute ─────────────────────────────────────────────────────────────
  DISPUTE_NOT_FOUND: 'Dispute not found',
  DISPUTE_ALREADY_EXISTS: 'A dispute already exists for this donation',

  // ─── Export ──────────────────────────────────────────────────────────────
  EXPORT_JOB_NOT_FOUND: (id: string) => `Export job ${id} not found`,

  // ─── API Key ─────────────────────────────────────────────────────────────
  API_KEY_NOT_FOUND: 'API key not found',

  // ─── Generic ─────────────────────────────────────────────────────────────
  FORBIDDEN: 'You are not authorized to perform this action',
  INTERNAL: 'An unexpected error occurred',
} as const;
