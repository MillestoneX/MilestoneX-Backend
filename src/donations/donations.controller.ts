import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Req,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DonationsService } from './donations.service';
import { CreateDonationDto } from './dto/create-donation.dto';
import {
  DonationResponseDto,
  PlatformTipResponseDto,
} from './dto/donation.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('Donations')
@ApiBearerAuth()
@Controller('donations')
export class DonationsController {
  constructor(private readonly donationsService: DonationsService) {}

  /**
   * POST /donations — Submit a new on-chain donation.
   * Verifies the Stellar transaction before persisting.
   */
  @ApiOperation({
    summary: 'Create a new donation (verifies on-chain transaction)',
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Req() req: Request & { user: any },
    @Body() dto: CreateDonationDto,
  ): Promise<{
    donation: DonationResponseDto;
    tip: PlatformTipResponseDto | null;
  }> {
    const walletAddress = String(req.user?.walletAddress ?? '');
    return this.donationsService.createDonation(walletAddress, dto);
  }

  /** GET /donations/me — Get all donations for the authenticated user */
  @ApiOperation({ summary: 'Get all donations for the current user' })
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyDonations(@Request() req: ExpressRequest & { user: any }) {
    const userId = req.user?.sub as string;
    return this.donationsService.findAll(userId);
  }

  /** GET /donations/:id — Get a single donation by ID (scoped to requesting user) */
  @ApiOperation({ summary: 'Get a single donation by ID' })
  @ApiParam({ name: 'id', description: 'Donation UUID' })
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getDonation(
    @Param('id') id: string,
    @Request() req: ExpressRequest & { user: any },
  ) {
    const userId = req.user?.sub as string;
    return this.donationsService.findById(id, userId);
  }

  /**
   * POST /donations/:txHash/verify — Re-verify a transaction on-chain.
   * Updates donation/tip status based on latest Stellar state.
   */
  @ApiOperation({
    summary: 'Re-verify a Stellar transaction and update donation status',
  })
  @ApiParam({ name: 'txHash', description: 'Stellar transaction hash' })
  @UseGuards(JwtAuthGuard)
  @Post(':txHash/verify')
  async verifyDonation(
    @Param('txHash') txHash: string,
  ): Promise<{ verified: boolean; status: string }> {
    const verified = await this.donationsService.verifyDonationOnChain(txHash);

    if (!verified) {
      const tipVerified = await this.donationsService.verifyTipOnChain(txHash);
      return {
        verified: tipVerified,
        status: tipVerified ? 'CONFIRMED' : 'PENDING',
      };
    }

    return {
      verified: true,
      status: 'CONFIRMED',
    };
  }
}
