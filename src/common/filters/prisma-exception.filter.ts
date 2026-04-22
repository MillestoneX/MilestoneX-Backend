import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from 'generated/prisma/client';

@Catch(
  Prisma.PrismaClientKnownRequestError,
  Prisma.PrismaClientValidationError,
  Prisma.PrismaClientUnknownRequestError,
)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = 500;
    let message = 'Internal server error';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      this.logger.error(`Prisma error ${exception.code}: ${exception.message}`);

      switch (exception.code) {
        case 'P2002':
          statusCode = 409;
          message = 'A record with this value already exists';
          break;
        case 'P2025':
          statusCode = 404;
          message = 'Record not found';
          break;
        case 'P2003':
          statusCode = 400;
          message = 'Foreign key constraint failed';
          break;
        case 'P2014':
          statusCode = 400;
          message = 'Invalid relation data';
          break;
        default:
          message = 'Database error occurred';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      this.logger.error(`Prisma validation error: ${exception.message}`);
      statusCode = 400;
      message = 'Invalid data provided';
    } else {
      this.logger.error(`Unknown Prisma error: ${exception.message}`);
    }

    const errorResponse = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
    };

    response.status(statusCode).json(errorResponse);
  }
}
