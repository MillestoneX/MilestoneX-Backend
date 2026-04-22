import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { RequestLoggerMiddleware } from './common/middleware';
import { winstonConfig } from './config/winston.config';
import { AppConfigurationModule } from './config/app-configuration.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [
    AppConfigurationModule,
    PrismaModule,
    AuthModule,
    WinstonModule.forRoot(winstonConfig),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
