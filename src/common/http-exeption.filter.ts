import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(LoggerService) private readonly logger?: LoggerService) {}
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message = 'Error occurred';
    let errors = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const res: any = exceptionResponse;
      message = res.message || message;
      errors = Array.isArray(res.message)
        ? res.message.map((msg: string) => ({
            field: msg.split(' ')[0],
            message: msg,
          }))
        : null;
    }

    // Log the exception with stack trace in non-production
    if (this.logger) {
      const trace = (exception as any).stack || null;
      this.logger.error(`${status} - ${message} - ${request.url}`, trace, {
        path: request.url,
        method: request.method,
      });
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}