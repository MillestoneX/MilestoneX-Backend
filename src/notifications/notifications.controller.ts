import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

/**
 * Notifications REST controller.
 * All endpoints require a valid JWT (JwtAuthGuard applied at controller level).
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications — Returns up to 50 notifications, optionally filtered by read status
   */
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @Get()
  async getNotifications(
    @Req() req: Request & { user: any },
    @Query('isRead') isRead?: string,
  ) {
    const userId = req.user?.sub as string;
    const isReadFilter =
      isRead === 'true' ? true : isRead === 'false' ? false : undefined;
    return this.notificationsService.getNotifications(userId, isReadFilter);
  }

  /**
   * PATCH /notifications/mark-read — Mark all notifications as read (auth required)
   */
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @UseGuards(JwtAuthGuard)
  @Patch('mark-read')
  async markAllRead(@Req() req: Request & { user: any }) {
    const userId = req.user?.sub as string;
    return this.notificationsService.markAllRead(userId);
  }

  /**
   * PATCH /notifications/:id/mark-read — Mark a single notification as read (auth required)
   */
  @ApiOperation({ summary: 'Mark a single notification as read' })
  @UseGuards(JwtAuthGuard)
  @Patch(':id/mark-read')
  async markOneRead(
    @Req() req: Request & { user: any },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const userId = req.user?.sub as string;
    return this.notificationsService.markOneRead(userId, id);
  }

  /**
   * DELETE /notifications — Delete all notifications for the authenticated user
   */
  @ApiOperation({ summary: 'Delete all notifications for the current user' })
  @UseGuards(JwtAuthGuard)
  @Delete()
  @HttpCode(HttpStatus.OK)
  async clearAllNotifications(@Req() req: Request & { user: any }) {
    const userId = req.user?.sub as string;
    return this.notificationsService.markAllRead(userId);
  }
}
