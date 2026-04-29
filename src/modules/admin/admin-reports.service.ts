import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export type ReportType = 'users' | 'projects' | 'donations' | 'withdrawals';

export interface ReportQuery {
  type: ReportType;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class AdminReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async generateReport(query: ReportQuery) {
    const { type, startDate, endDate } = query;
    const dateFilter =
      startDate && endDate
        ? { createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }
        : {};

    switch (type) {
      case 'users':
        return this.usersReport(dateFilter);
      case 'projects':
        return this.projectsReport(dateFilter);
      case 'donations':
        return this.donationsReport(dateFilter);
      case 'withdrawals':
        return this.withdrawalsReport(dateFilter);
    }
  }

  async exportCsv(query: ReportQuery): Promise<string> {
    const report = await this.generateReport(query);
    const { summary, data } = report as any;

    if (!data || data.length === 0) {
      return 'No data found for the given filters';
    }

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row: any) =>
      Object.values(row)
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
        .join(','),
    );

    const summaryLines = Object.entries(summary)
      .map(([k, v]) => `# ${k}: ${v}`)
      .join('\n');

    return `${summaryLines}\n\n${headers}\n${rows.join('\n')}`;
  }

  private async usersReport(dateFilter: any) {
    const [data, total, verified] = await Promise.all([
      this.prisma.user.findMany({
        where: { deletedAt: null, ...dateFilter },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          kycStatus: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where: { deletedAt: null, ...dateFilter } }),
      this.prisma.user.count({ where: { deletedAt: null, kycStatus: 'VERIFIED', ...dateFilter } }),
    ]);

    return { summary: { total, verified, unverified: total - verified }, data };
  }

  private async projectsReport(dateFilter: any) {
    const data = await this.prisma.project.findMany({
      where: dateFilter,
      select: {
        id: true,
        title: true,
        status: true,
        goalAmount: true,
        raisedAmount: true,
        category: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalGoal = data.reduce((s, p) => s + Number(p.goalAmount), 0);
    const totalRaised = data.reduce((s, p) => s + Number(p.raisedAmount), 0);

    return {
      summary: { total: data.length, totalGoal, totalRaised },
      data,
    };
  }

  private async donationsReport(dateFilter: any) {
    const data = await this.prisma.donation.findMany({
      where: dateFilter,
      select: {
        id: true,
        amount: true,
        assetType: true,
        status: true,
        transactionHash: true,
        projectId: true,
        donorId: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const completed = data.filter((d) => d.status === 'COMPLETED');
    const totalAmount = completed.reduce((s, d) => s + Number(d.amount), 0);

    return {
      summary: { total: data.length, completed: completed.length, totalAmount },
      data,
    };
  }

  private async withdrawalsReport(dateFilter: any) {
    const data = await this.prisma.withdrawal.findMany({
      where: dateFilter,
      select: {
        id: true,
        amount: true,
        assetCode: true,
        status: true,
        projectId: true,
        creatorId: true,
        walletAddress: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalAmount = data.reduce((s, w) => s + Number(w.amount), 0);

    return {
      summary: { total: data.length, totalAmount },
      data,
    };
  }
}
