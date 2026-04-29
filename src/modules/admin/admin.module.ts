import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin-users.controller';
import { AdminProjectsController } from './admin-projects.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminReportsController } from './admin-reports.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminWithdrawalsService } from './admin-withdrawals.service';
import { PlatformSettingsService } from './platform-settings.service';
import { AdminReportsService } from './admin-reports.service';
import { PrismaModule } from '../../database/prisma.module';
import { EmailService } from '../users/email.service';
import { ProjectsModule } from '../projects/projects.module';
import { WithdrawalsModule } from '../withdrawals/withdrawals.module';

@Module({
  imports: [PrismaModule, ProjectsModule, WithdrawalsModule],
  controllers: [
    AdminUsersController,
    AdminProjectsController,
    AdminWithdrawalsController,
    AdminSettingsController,
    AdminReportsController,
  ],
  providers: [
    AdminUsersService,
    AdminWithdrawalsService,
    EmailService,
    PlatformSettingsService,
    AdminReportsService,
  ],
})
export class AdminModule {}
