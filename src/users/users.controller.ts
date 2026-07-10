import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateKYCStatusDto } from './dto/update-kyc-status.dto';
import { UserProfileDto, PublicUserProfileDto } from './dto/user-profile.dto';
import {
  NotificationPreferencesDto,
  UpdateNotificationPreferencesDto,
} from './dto/notification-preferences.dto';
import {
  GetUserDonationsQueryDto,
  ExportDonationHistoryQueryDto,
} from './dto/get-user-donations.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /** GET /users/me/activity — Retrieve authenticated user's activity summary */
  @ApiOperation({ summary: "Get the current user's activity summary" })
  @UseGuards(JwtAuthGuard)
  @Get('me/activity')
  async getMyActivitySummary(@Request() req: any) {
    const userId = req.user?.sub as string;
    return this.usersService.getUserActivitySummary(userId);
  }

  /** GET /users/me — Retrieve authenticated user's full profile */
  @ApiOperation({ summary: "Get the current user's full profile" })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req: any): Promise<UserProfileDto> {
    return this.usersService.getMyProfile(req.user.walletAddress);
  }

  /** PATCH /users/me — Update authenticated user's profile */
  @ApiOperation({ summary: "Update the current user's profile" })
  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMyProfile(
    @Request() req: any,
    @Body() updateDto: UpdateUserDto,
  ): Promise<UserProfileDto> {
    return this.usersService.updateMyProfile(req.user.walletAddress, updateDto);
  }

  /** GET /users/me/donations — Retrieve donation history with filters */
  @ApiOperation({ summary: "Get the current user's donation history" })
  @UseGuards(JwtAuthGuard)
  @Get('me/donations')
  async getMyDonations(
    @Request() req: any,
    @Query() query: GetUserDonationsQueryDto,
  ): Promise<any> {
    const userId = req.user?.sub as string;
    return this.usersService.getUserDonationHistory(
      userId,
      query.page,
      query.limit,
      query.sortBy,
      query.order,
      query.campaignId,
      query.startDate,
      query.endDate,
    );
  }

  /**
   * GET /users/me/donations/export
   * Export user's donation history as CSV.
   */
  @ApiOperation({ summary: "Export the current user's donations as CSV" })
  @ApiQuery({ name: 'campaignId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @UseGuards(JwtAuthGuard)
  @Get('me/donations/export')
  async exportMyDonations(
    @Request() req: any,
    @Query() query: ExportDonationHistoryQueryDto,
    @Res() res: Response,
  ): Promise<void> {
    const userId = req.user?.sub as string;
    const result = await this.usersService.exportUserDonationsAsCSV(
      userId,
      query.campaignId,
      query.startDate,
      query.endDate,
    );

    if (result.queued) {
      res.status(202).json({
        message: 'Export queued. Poll the status endpoint for completion.',
        jobId: result.jobId,
        statusUrl: `/users/me/donations/export/${result.jobId}/status`,
      });
      return;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="donations.csv"',
    );
    res.status(200).send(result.csv);
  }

  /**
   * GET /users/me/donations/export/:jobId/status
   * Poll the status of a queued export job.
   */
  @ApiOperation({ summary: 'Poll the status of an async export job' })
  @ApiParam({
    name: 'jobId',
    description: 'Bull job ID returned by the export endpoint',
  })
  @UseGuards(JwtAuthGuard)
  @Get('me/donations/export/:jobId/status')
  async getExportJobStatus(
    @Param('jobId') jobId: string,
    @Res() res: Response,
  ): Promise<void> {
    const result = await this.usersService.getExportJobStatus(jobId);

    if (result.status === 'completed' && result.csv) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="donations.csv"',
      );
      res.status(200).send(result.csv);
      return;
    }

    res.status(200).json({ status: result.status, rowCount: result.rowCount });
  }

  /** GET /users/me/notification-preferences — Retrieve preferences */
  @ApiOperation({ summary: "Get the current user's notification preferences" })
  @UseGuards(JwtAuthGuard)
  @Get('me/notification-preferences')
  async getNotificationPreferences(
    @Request() req: any,
  ): Promise<NotificationPreferencesDto> {
    return this.usersService.getNotificationPreferences(req.user.sub);
  }

  /** PATCH /users/me/notification-preferences — Update preferences */
  @ApiOperation({
    summary: "Update the current user's notification preferences",
  })
  @UseGuards(JwtAuthGuard)
  @Patch('me/notification-preferences')
  async updateNotificationPreferences(
    @Request() req: any,
    @Body() updateDto: UpdateNotificationPreferencesDto,
  ): Promise<NotificationPreferencesDto> {
    return this.usersService.updateNotificationPreferences(
      req.user.sub,
      updateDto,
    );
  }

  /** GET /users/:walletAddress — Retrieve public user profile */
  @ApiOperation({ summary: 'Get public profile for a user by wallet address' })
  @ApiParam({ name: 'walletAddress', description: 'Stellar wallet address' })
  @Get(':walletAddress')
  async getPublicProfile(
    @Param('walletAddress') walletAddress: string,
  ): Promise<PublicUserProfileDto> {
    return this.usersService.getPublicProfile(walletAddress);
  }
}

@ApiTags('Admin - Users')
@ApiBearerAuth()
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * PATCH /admin/users/:id/kyc
   * Update user's KYC status (admin only)
   */
  @ApiOperation({ summary: "Update a user's KYC status (admin only)" })
  @ApiParam({ name: 'id', description: 'User UUID' })
  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id/kyc')
  async updateKYCStatus(
    @Param('id') userId: string,
    @Body() updateDto: UpdateKYCStatusDto,
    @Request() req: any,
  ): Promise<{ success: boolean; message: string }> {
    return this.usersService.updateKYCStatus(
      userId,
      updateDto.status,
      req.user.walletAddress,
    );
  }
}
