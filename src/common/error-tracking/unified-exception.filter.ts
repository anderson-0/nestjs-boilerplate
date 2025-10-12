import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { UnifiedErrorTrackingService } from './unified-error-tracking.service';

@Catch()
export class UnifiedExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(UnifiedExceptionFilter.name);

  constructor(private readonly errorTrackingService: UnifiedErrorTrackingService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const userId = (request as any).user?.id;
    const userEmail = (request as any).user?.email;

    // Set user context if available
    if (userId) {
      this.errorTrackingService.setUser(userId, userEmail);
    }

    // Convert exception to Error if it's not already
    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    // Capture the exception with request context
    this.errorTrackingService.captureHttpException(error, request, { statusCode: status }, userId);

    // Log to console in development
    if (process.env.NODE_ENV !== 'production') {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    // Send response
    response.status(status).send({
      success: false,
      error: {
        code: status >= 500 ? 'INTERNAL_SERVER_ERROR' : 'CLIENT_ERROR',
        message,
      },
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { stack: exception.stack }),
    });
  }
}