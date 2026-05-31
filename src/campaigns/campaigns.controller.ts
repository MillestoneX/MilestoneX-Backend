import {
  Controller,
  Get,
  Query,
  UseInterceptors,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CampaignsService } from './campaigns.service';
import { BrowseCampaignsQueryDto, BrowseCampaignsResponseDto } from './dto/browse-campaigns.dto';

@Controller('campaigns')
export class CampaignsController {
  constructor(
    private readonly campaignsService: CampaignsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * GET /campaigns
   * Browse public campaigns with pagination, filtering, and sorting
   * Query params: page, limit, category, status, search, sortBy
   * Cached for 30 seconds
   */
  @Get()
  async browseCampaigns(
    @Query() query: BrowseCampaignsQueryDto,
  ): Promise<BrowseCampaignsResponseDto> {
    // Generate cache key based on query parameters
    const cacheKey = this.generateCacheKey(query);

    // Try to get from cache
    const cached = await this.cacheManager.get<BrowseCampaignsResponseDto>(
      cacheKey,
    );
    if (cached) {
      return cached;
    }

    // If not cached, fetch from service
    const result = await this.campaignsService.browseCampaigns(query);

    // Cache the result for 30 seconds
    await this.cacheManager.set(cacheKey, result, 30000);

    return result;
  }

  /**
   * Generate a cache key based on query parameters
   */
  private generateCacheKey(query: BrowseCampaignsQueryDto): string {
    const parts = [
      'campaigns',
      `page:${query.page}`,
      `limit:${query.limit}`,
      `sortBy:${query.sortBy}`,
    ];

    if (query.category) {
      parts.push(`category:${query.category}`);
    }

    if (query.status) {
      parts.push(`status:${query.status}`);
    }

    if (query.search) {
      parts.push(`search:${query.search}`);
    }

    return parts.join(':');
  }
}
