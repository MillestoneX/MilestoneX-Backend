import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Maximum stored searches per user */
const MAX_HISTORY = 20;

@Injectable()
export class SearchHistoryService {
  private readonly logger = new Logger(SearchHistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a search query for a user.
   * If the term was already searched recently it is moved to the top (upsert-like).
   * Enforces a per-user cap of MAX_HISTORY entries — oldest entries are pruned.
   *
   * This method is fire-and-forget safe: errors are swallowed and logged so that
   * a failed history write never breaks the actual search response.
   *
   * @param userId    The authenticated user's UUID
   * @param query     The search term that was used
   */
  async recordSearch(userId: string, query: string): Promise<void> {
    const trimmed = query?.trim();
    if (!trimmed || !userId) return;

    try {
      await this.prisma.$transaction(async (tx) => {
        // Remove any existing entry for the same term so we can re-insert at top
        await tx.searchHistory.deleteMany({
          where: { userId, query: trimmed },
        });

        // Insert fresh entry
        await tx.searchHistory.create({
          data: { userId, query: trimmed },
        });

        // Enforce cap: delete entries beyond MAX_HISTORY
        const oldest = await tx.searchHistory.findMany({
          where: { userId },
          orderBy: { searchedAt: 'desc' },
          skip: MAX_HISTORY,
          select: { id: true },
        });

        if (oldest.length > 0) {
          await tx.searchHistory.deleteMany({
            where: { id: { in: oldest.map((r) => r.id) } },
          });
        }
      });
    } catch (err) {
      this.logger.warn(
        `Failed to record search history for user ${userId}: ${(err as Error).message}`,
      );
    }
  }

  /**
   * Get the most recent search history for a user.
   *
   * @param userId  The authenticated user's UUID
   * @param limit   Maximum number of entries to return (default: 10)
   */
  async getSearchHistory(
    userId: string,
    limit = 10,
  ): Promise<{ id: string; query: string; searchedAt: Date }[]> {
    return this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { searchedAt: 'desc' },
      take: Math.min(limit, MAX_HISTORY),
      select: { id: true, query: true, searchedAt: true },
    });
  }

  /**
   * Delete a single search history entry belonging to the user.
   */
  async deleteSearchEntry(userId: string, entryId: string): Promise<void> {
    await this.prisma.searchHistory.deleteMany({
      where: { id: entryId, userId },
    });
  }

  /**
   * Clear all search history for a user.
   */
  async clearSearchHistory(userId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.searchHistory.deleteMany({
      where: { userId },
    });
    return { deleted: result.count };
  }
}
