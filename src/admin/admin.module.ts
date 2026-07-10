import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AdminService } from './admin.service';
import { AdminController, DisputesController } from './admin.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

/** Module providing admin campaign suspension, dispute management, user moderation, and audit logging */
@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [AdminController, DisputesController],
  providers: [AdminService, JwtAuthGuard, RolesGuard],
})
export class AdminModule {}
