import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { BrowseCampaignsQueryDto, BrowseCampaignsResponseDto } from './dto/browse-campaigns.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Browse public campaigns with pagination, filtering, and sorting
   * Excludes DRAFT and SUSPENDED campaigns
   */
  async browseCampaigns(
    query: BrowseCampaignsQueryDto,
  ): Promise<BrowseCampaignsResponseDto> {
    const { page, limit, category, status, search, sortBy } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.CampaignWhereInput = {
      // Always exclude DRAFT and SUSPENDED campaigns
      status: {
        notIn: ['DRAFT', 'SUSPENDED'],
      },
    };

    // Add category filter if provided
    if (category) {
      where.category = {
        equals: category,
        mode: 'insensitive',
      };
    }

    // Add status filter if provided (in addition to default exclusions)
    if (status) {
      where.status = status as any;
    }

    // Add search filter (searches in title and description)
    if (search) {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: search,
            mode: 'insensitive',
          },
        },
      ];
    }

    // Determine order by
    let orderBy: Prisma.CampaignOrderByWithRelationInput = {};
    switch (sortBy) {
      case 'mostFunded':
        orderBy = {
          raisedAmount: 'desc',
        };
        break;
      case 'endingSoon':
        orderBy = {
          endDate: 'asc',
        };
        break;
      case 'newest':
      default:
        orderBy = {
          createdAt: 'desc',
        };
    }

    // Fetch total count
    const total = await this.prisma.campaign.count({ where });

    // Fetch campaigns
    const campaigns = await this.prisma.campaign.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        goalAmount: true,
        raisedAmount: true,
        status: true,
        creatorId: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
        category: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            walletAddress: true,
          },
        },
        _count: {
          select: {
            donations: true,
            milestones: true,
          },
        },
      },
      orderBy,
      skip,
      take: limit,
    });

    return {
      data: campaigns,
      total,
      page,
      limit,
    };
  }
}
