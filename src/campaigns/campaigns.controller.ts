import {
  Controller,
  Get,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CampaignsService } from './campaigns.service';
import { CampaignStats } from './interfaces/campaign-stats.interface';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('campaigns')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class CampaignsController {
  constructor(private readonly campaignsService: CampaignsService) {}

  @Get(':id/stats')
  @Roles('creator', 'admin')
  async getCampaignStats(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CampaignStats> {
    return this.campaignsService.getCampaignStats(id);
  }
}
