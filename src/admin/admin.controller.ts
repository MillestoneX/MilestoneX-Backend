import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { SuspendCampaignDto } from './dtos/suspend-campaign.dto';
import { FileDisputeDto, ResolveDisputeDto } from './dtos/dispute.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** POST /admin/campaigns/:id/suspend — Suspend a campaign (admin only) */
  @ApiOperation({ summary: 'Suspend a campaign (admin only)' })
  @ApiParam({ name: 'id', description: 'Campaign UUID' })
  @Post('campaigns/:id/suspend')
  async suspendCampaign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SuspendCampaignDto,
    @Request() req: any,
  ): Promise<{ message: string; notificationSent: boolean }> {
    const result = await this.adminService.suspendCampaign(
      id,
      dto,
      req.user.sub,
      req.user.email,
    );
    return result;
  }

  /** POST /admin/disputes/:id/resolve — Resolve a dispute (admin only) */
  @ApiOperation({ summary: 'Resolve a dispute (admin only)' })
  @ApiParam({ name: 'id', description: 'Dispute UUID' })
  @Post('disputes/:id/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveDispute(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolveDisputeDto,
    @Request() req: any,
  ) {
    return this.adminService.resolveDispute(id, req.user.sub, dto.resolution);
  }
}

/** Disputes controller — authenticated users can file disputes */
@ApiTags('Disputes')
@ApiBearerAuth()
@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly adminService: AdminService) {}

  /** POST /disputes — File a new dispute against a donation */
  @ApiOperation({ summary: 'File a dispute against a donation' })
  @Post()
  async fileDispute(@Body() dto: FileDisputeDto, @Request() req: any) {
    return this.adminService.fileDispute(req.user.sub, dto);
  }
}
