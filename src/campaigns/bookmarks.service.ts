import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bookmark a campaign for the authenticated user.
   * Returns the bookmark record. Throws ConflictException if already bookmarked.
   */
  async addBookmark(
    userId: string,
    campaignId: string,
  ): Promise<{ id: string; campaignId: string; createdAt: Date }> {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { id: true },
    });
    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    const existing = await this.prisma.campaignBookmark.findUnique({
      where: { userId_campaignId: { userId, campaignId } },
    });
    if (existing) {
      throw new ConflictException('Campaign is already bookmarked');
    }

    return this.prisma.campaignBookmark.create({
      data: { userId, campaignId },
      select: { id: true, campaignId: true, createdAt: true },
    });
  }

  /**
   * Remove a bookmark. Silently succeeds if the bookmark did not exist.
   */
  async removeBookmark(userId: string, campaignId: string): Promise<void> {
    await this.prisma.campaignBookmark.deleteMany({
      where: { userId, campaignId },
    });
  }

  /**
   * Get all bookmarked campaigns for the authenticated user.
   * Returns lightweight campaign summaries ordered by most recently bookmarked.
   */
  async getUserBookmarks(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: unknown[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [total, bookmarks] = await this.prisma.$transaction([
      this.prisma.campaignBookmark.count({ where: { userId } }),
      this.prisma.campaignBookmark.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          campaign: {
            select: {
              id: true,
              title: true,
              description: true,
              imageUrl: true,
              status: true,
              goalAmount: true,
              raisedAmount: true,
              category: true,
              endDate: true,
            },
          },
        },
      }),
    ]);

    return { data: bookmarks, total, page, limit };
  }

  /**
   * Check whether a user has bookmarked a specific campaign.
   */
  async isBookmarked(userId: string, campaignId: string): Promise<boolean> {
    const record = await this.prisma.campaignBookmark.findUnique({
      where: { userId_campaignId: { userId, campaignId } },
      select: { id: true },
    });
    return record !== null;
  }
}
