import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { QUEUE_EMAIL } from '../queue/queue.constants';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NewsletterController } from './newsletter.controller';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { NotificationsGateway } from './notifications.gateway';

/** Module providing WebSocket gateway, email notifications, newsletter, and notification preferences */
@Module({
  imports: [
    PrismaModule,
    AuthModule,
    BullModule.registerQueue({ name: QUEUE_EMAIL }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'milestonex-default-secret'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [NotificationsController, NewsletterController],
  providers: [
    NotificationsService,
    EmailService,
    EmailProcessor,
    NotificationsGateway,
  ],
  exports: [NotificationsService, EmailService, NotificationsGateway],
})
export class NotificationsModule {}
