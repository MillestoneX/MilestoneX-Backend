import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true, // strip unknown properties
        forbidNonWhitelisted: true,
        transform: true, // auto-transform types
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Use our LoggerService for bootstrap logs
    const logger = app.get(LoggerService);

    await app.listen(process.env.PORT || 3000);

    logger.log(`🚀 Server is running on http://localhost:${process.env.PORT || 3000}`);
  } catch (error) {
    // If logger is not available yet, fall back to console
    try {
      const tmpApp = await NestFactory.create(AppModule);
      const tmpLogger = tmpApp.get(LoggerService);
      tmpLogger.error('❌ Application failed to start', error.stack);
    } catch (e) {
      // fallback
      // eslint-disable-next-line no-console
      console.error('❌ Application failed to start', error.stack);
    }
    process.exit(1);
  }
}
bootstrap();