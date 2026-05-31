import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Campaign } from './entities/campaign.entity';
import { Donation } from '../donations/entities/donation.entity';
import { CampaignStats, DonationsPerDay, TopDonor } from './interfaces/campaign-stats.interface';

@Injectable()
export class CampaignsService {
  constructor(
    @InjectRepository(Campaign)
    private readonly campaignRepo: Repository<Campaign>,
    @InjectRepository(Donation)
    private readonly donationRepo: Repository<Donation>,
  ) {}

  async getCampaignStats(campaignId: string): Promise<CampaignStats> {
    const campaign = await this.campaignRepo.findOne({ where: { id: campaignId } });
    if (!campaign) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Aggregate totals
    const totals = await this.donationRepo
      .createQueryBuilder('d')
      .select('SUM(d.amount)', 'totalRaised')
      .addSelect('COUNT(DISTINCT d.donorId)', 'donorCount')
      .addSelect('AVG(d.amount)', 'avgDonation')
      .where('d.campaignId = :campaignId', { campaignId })
      .getRawOne<{ totalRaised: string; donorCount: string; avgDonation: string }>();

    // Unique assets
    const assetRows = await this.donationRepo
      .createQueryBuilder('d')
      .select('DISTINCT d.assetCode', 'assetCode')
      .where('d.campaignId = :campaignId', { campaignId })
      .getRawMany<{ assetCode: string }>();

    // Donations per day (last 30 days)
    const perDayRows = await this.donationRepo
      .createQueryBuilder('d')
      .select("TO_CHAR(d.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(d.amount)', 'total')
      .where('d.campaignId = :campaignId', { campaignId })
      .andWhere('d.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .groupBy("TO_CHAR(d.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(d.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany<{ date: string; count: string; total: string }>();

    // Top donors (top 10 by total donated)
    const topDonorRows = await this.donationRepo
      .createQueryBuilder('d')
      .select('d.donorId', 'donorId')
      .addSelect('SUM(d.amount)', 'totalDonated')
      .addSelect('COUNT(*)', 'donationCount')
      .where('d.campaignId = :campaignId', { campaignId })
      .groupBy('d.donorId')
      .orderBy('SUM(d.amount)', 'DESC')
      .limit(10)
      .getRawMany<{ donorId: string; totalDonated: string; donationCount: string }>();

    const donationsPerDay: DonationsPerDay[] = perDayRows.map((r) => ({
      date: r.date,
      count: parseInt(r.count, 10),
      total: parseFloat(r.total),
    }));

    const topDonors: TopDonor[] = topDonorRows.map((r) => ({
      donorId: r.donorId,
      totalDonated: parseFloat(r.totalDonated),
      donationCount: parseInt(r.donationCount, 10),
    }));

    return {
      campaignId,
      totalRaised: parseFloat(totals?.totalRaised ?? '0'),
      donorCount: parseInt(totals?.donorCount ?? '0', 10),
      uniqueAssets: assetRows.map((r) => r.assetCode),
      avgDonation: parseFloat(totals?.avgDonation ?? '0'),
      donationsPerDay,
      topDonors,
    };
  }
}
