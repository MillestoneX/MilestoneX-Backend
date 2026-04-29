import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { AdminReportsService, ReportQuery } from './admin-reports.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/types/user-role.enum';
import { IsEnum, IsOptional, IsDateString } from 'class-validator';

class GenerateReportDto implements ReportQuery {
  @IsEnum(['users', 'projects', 'donations', 'withdrawals'])
  type!: 'users' | 'projects' | 'donations' | 'withdrawals';

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}

@Controller('admin/reports')
@Roles(UserRole.ADMIN)
export class AdminReportsController {
  constructor(private readonly adminReportsService: AdminReportsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateReportDto) {
    return this.adminReportsService.generateReport(dto);
  }

  @Post('generate/csv')
  async exportCsv(@Body() dto: GenerateReportDto, @Res() res: Response) {
    const csv = await this.adminReportsService.exportCsv(dto);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${dto.type}-report.csv"`);
    res.send(csv);
  }
}
