import { BadRequestException } from '@nestjs/common';
import { CampaignStatus } from '@prisma/client';

/**
 * Valid campaign status transitions map.
 * Key = current status, Value = set of statuses the campaign may transition to.
 *
 * Rules:
 * - DRAFT → PENDING_APPROVAL (creator submits for review)
 * - PENDING_APPROVAL → ACTIVE (admin approves) | REJECTED (admin rejects)
 * - ACTIVE → COMPLETED | CANCELLED (admin suspends or creator completes)
 * - COMPLETED → (terminal — no further transitions)
 * - CANCELLED → (terminal — no further transitions)
 * - REJECTED → DRAFT (creator revises and re-submits)
 */
const ALLOWED_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  [CampaignStatus.DRAFT]: [CampaignStatus.PENDING_APPROVAL],
  [CampaignStatus.PENDING_APPROVAL]: [
    CampaignStatus.ACTIVE,
    CampaignStatus.REJECTED,
  ],
  [CampaignStatus.ACTIVE]: [CampaignStatus.COMPLETED, CampaignStatus.CANCELLED],
  [CampaignStatus.COMPLETED]: [],
  [CampaignStatus.CANCELLED]: [],
  [CampaignStatus.REJECTED]: [CampaignStatus.DRAFT],
};

/**
 * Assert that transitioning a campaign from `current` to `next` is permitted.
 * Throws `BadRequestException` when the transition is illegal.
 *
 * @param current  The campaign's current status
 * @param next     The desired target status
 */
export function assertValidStatusTransition(
  current: CampaignStatus,
  next: CampaignStatus,
): void {
  if (current === next) return; // no-op transition is always acceptable

  const allowed = ALLOWED_TRANSITIONS[current] ?? [];
  if (!allowed.includes(next)) {
    throw new BadRequestException(
      `Invalid campaign status transition: ${current} → ${next}. ` +
        `Allowed transitions from ${current}: [${allowed.join(', ') || 'none'}]`,
    );
  }
}

/**
 * Returns the list of valid next statuses for a given current status.
 */
export function getAllowedTransitions(current: CampaignStatus): CampaignStatus[] {
  return ALLOWED_TRANSITIONS[current] ?? [];
}
