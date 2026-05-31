import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCampaignDto } from './dto/update-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateCampaign(
    userId: string,
    campaignId: string,
    dto: UpdateCampaignDto,
  ) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (campaign.creatorId !== userId) {
      throw new ForbiddenException('Only the campaign creator can update this');
    }

    const updated = await this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        title: dto.title ?? campaign.title,
        // Prefer explicit description, fallback to story alias
        description: dto.description ?? dto.story ?? campaign.description,
        // Map coverImageUrl to imageUrl in the DB
        imageUrl: dto.coverImageUrl ?? campaign.imageUrl,
      },
    });

    return updated;
  }

  async createCampaign(userId: string, dto: any) {
    // Prepare milestone create data if provided
    const milestoneCreates = (dto.milestones || []).map((m: any) => ({
      title: m.title,
      description: m.description ?? null,
      targetAmount: m.targetAmount ?? undefined,
      dueDate: m.dueDate ? new Date(m.dueDate) : undefined,
    }));

    const data: any = {
      title: dto.title,
      description: dto.description ?? dto.story ?? undefined,
      imageUrl: dto.coverImageUrl ?? undefined,
      category: dto.category ?? undefined,
      goalAmount: dto.goalAmount ?? undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: 'ACTIVE',
      creatorId: userId,
      milestones: milestoneCreates.length > 0 ? { create: milestoneCreates } : undefined,
    };

    const created = await this.prisma.campaign.create({
      data,
      include: { milestones: true },
    });

    return created;
  }
}
