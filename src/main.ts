import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerService } from './logger/logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

    // Swagger setup - enabled by default in non-production, configurable via env
    const enableSwagger = process.env.ENABLE_SWAGGER === 'true' || process.env.NODE_ENV !== 'production';
    if (enableSwagger) {
      const config = new DocumentBuilder()
        .setTitle('StellarAid API')
        .setDescription('StellarAid Backend API - Blockchain-enabled crowdfunding platform on Stellar network')
        .setVersion('1.0.0')
        .addBearerAuth(
          {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
          },
          'JWT-auth',
        )
        .addTag('Auth', 'Authentication endpoints')
        .addTag('Users', 'User management endpoints')
        .addTag('Projects', 'Project management endpoints')
        .build();

      const document = SwaggerModule.createDocument(app, config);
      SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
          persistAuthorization: true,
        },
        customSiteTitle: 'StellarAid API Docs',
      });

      // Expose OpenAPI JSON at /docs-json
      app.use('/docs-json', (req, res) => {
        res.json(document);
      });

      logger.log('📚 Swagger UI available at /docs');
      logger.log('📄 OpenAPI JSON available at /docs-json');
    }

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