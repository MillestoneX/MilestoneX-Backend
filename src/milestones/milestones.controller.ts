import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MilestonesService } from './milestones.service';
import {
  RequestFundReleaseDto,
  FundReleaseResponseDto,
} from '../campaigns/dto/request-fund-release.dto';
import { JwtAuthGuard } from '../users/guards/jwt-auth.guard';

@Controller('campaigns/:campaignId/milestones')
export class MilestonesController {
  constructor(private readonly milestonesService: MilestonesService) {}

  /**
   * POST /campaigns/:campaignId/milestones/:milestoneId/release
   * Request fund release for an unlocked milestone (canonical path).
   */
  @UseGuards(JwtAuthGuard)
  @Post(':milestoneId/release')
  async requestFundReleaseAlias(
    @Param('campaignId') campaignId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: RequestFundReleaseDto,
    @Request() req: any,
  ): Promise<FundReleaseResponseDto> {
    const creatorId = req.user?.sub as string;
    return this.milestonesService.requestFundRelease(
      campaignId,
      milestoneId,
      creatorId,
      dto,
    );
  }

  /**
   * POST /campaigns/:campaignId/milestones/:milestoneId/fund-releases
   * Request fund release for an unlocked milestone (legacy compat path).
   */
  @UseGuards(JwtAuthGuard)
  @Post(':milestoneId/fund-releases')
  async requestFundRelease(
    @Param('campaignId') campaignId: string,
    @Param('milestoneId') milestoneId: string,
    @Body() dto: RequestFundReleaseDto,
    @Request() req: any,
  ): Promise<FundReleaseResponseDto> {
    const creatorId = req.user?.sub as string;
    return this.milestonesService.requestFundRelease(
      campaignId,
      milestoneId,
      creatorId,
      dto,
    );
  }

  /** GET fund release details by release ID */
  @UseGuards(JwtAuthGuard)
  @Get(':milestoneId/fund-releases/:releaseId')
  async getFundRelease(
    @Param('campaignId') campaignId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('releaseId') releaseId: string,
    @Request() req: any,
  ) {
    const requester = {
      userId: req.user.sub as string,
      role: req.user.role as string,
    };
    return this.milestonesService.getFundReleaseById(releaseId, requester);
  }

  /** List all fund releases for a campaign */
  @UseGuards(JwtAuthGuard)
  @Get('fund-releases')
  async getCampaignFundReleases(
    @Param('campaignId') campaignId: string,
    @Request() req: any,
  ) {
    const requester = {
      userId: req.user.sub as string,
      role: req.user.role as string,
    };
    return this.milestonesService.getCampaignFundReleases(
      campaignId,
      requester,
    );
  }

  /** Aggregate fund release stats grouped by status for a campaign */
  @UseGuards(JwtAuthGuard)
  @Get('fund-releases/stats')
  async getFundReleaseStats(
    @Param('campaignId') campaignId: string,
    @Request() req: any,
  ) {
    const requester = {
      userId: req.user.sub as string,
      role: req.user.role as string,
    };
    return this.milestonesService.getCampaignFundReleaseStats(
      campaignId,
      requester,
    );
  }

  /** Cancel a pending fund release (creator only) */
  @UseGuards(JwtAuthGuard)
  @Delete(':milestoneId/fund-releases/:releaseId')
  async cancelFundRelease(
    @Param('campaignId') campaignId: string,
    @Param('milestoneId') milestoneId: string,
    @Param('releaseId') releaseId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.sub as string;
    return this.milestonesService.cancelFundRelease(releaseId, userId);
  }

  /**
   * POST /campaigns/:campaignId/milestones/:milestoneId/complete
   * Mark a milestone as COMPLETED (creator only).
   */
  @UseGuards(JwtAuthGuard)
  @Post(':milestoneId/complete')
  async completeMilestone(
    @Param('campaignId') campaignId: string,
    @Param('milestoneId') milestoneId: string,
    @Body('txHash') txHash: string | undefined,
    @Request() req: any,
  ) {
    const creatorId = req.user?.sub as string;
    return this.milestonesService.completeMilestone(
      campaignId,
      milestoneId,
      creatorId,
      txHash,
    );
  }
}
