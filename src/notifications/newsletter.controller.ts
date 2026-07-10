import {
  Controller,
  Post,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { NewsletterSubscribeDto } from './dto/newsletter-subscribe.dto';

/**
 * Newsletter subscription controller.
 * Authenticated users can subscribe or unsubscribe from the platform newsletter.
 */
@ApiTags('Newsletter')
@ApiBearerAuth()
@Controller('newsletter')
@UseGuards(JwtAuthGuard)
export class NewsletterController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * POST /newsletter/subscribe
   * Subscribe the authenticated user to the newsletter.
   * Upserts the newsletter record so re-subscribing after unsubscribing works correctly.
   */
  @ApiOperation({ summary: 'Subscribe to the MilestoneX newsletter' })
  @Post('subscribe')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @Body() dto: NewsletterSubscribeDto,
    @Request() req: any,
  ): Promise<{ message: string }> {
    const userId = req.user?.sub as string;

    await this.prisma.newsletter.upsert({
      where: { userId },
      create: {
        userId,
        email: dto.email,
        isSubscribed: true,
        subscribedAt: new Date(),
      },
      update: {
        email: dto.email,
        isSubscribed: true,
        subscribedAt: new Date(),
        unsubscribedAt: null,
      },
    });

    return { message: 'Successfully subscribed to the newsletter' };
  }

  /**
   * DELETE /newsletter/unsubscribe
   * Unsubscribe the authenticated user from the newsletter.
   * Sets isSubscribed to false and records the unsubscribedAt timestamp.
   */
  @ApiOperation({ summary: 'Unsubscribe from the MilestoneX newsletter' })
  @Delete('unsubscribe')
  @HttpCode(HttpStatus.OK)
  async unsubscribe(@Request() req: any): Promise<{ message: string }> {
    const userId = req.user?.sub as string;

    await this.prisma.newsletter.updateMany({
      where: { userId },
      data: {
        isSubscribed: false,
        unsubscribedAt: new Date(),
      },
    });

    return { message: 'Successfully unsubscribed from the newsletter' };
  }
}
