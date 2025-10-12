import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { BugsnagService } from './bugsnag.service';

@Catch()
export class BugsnagExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BugsnagExceptionFilter.name);

  constructor(private readonly bugsnagService: BugsnagService) {}

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

    const metadata = {
      request: {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
        headers: this.sanitizeHeaders(request.headers),
        ip: request.ip,
        userAgent: request.headers['user-agent'],
      },
      response: {
        statusCode: status,
        message,
      },
      user: userId ? { id: userId, email: userEmail } : undefined,
      timestamp: new Date().toISOString(),
    };

    const error =
      exception instanceof Error ? exception : new Error(String(exception));

    const severity = status >= 500 ? 'error' : status >= 400 ? 'warning' : 'info';

    this.bugsnagService.notify(error, metadata, severity);

    if (process.env.NODE_ENV !== 'production') {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status}`,
        exception instanceof Error ? exception.stack : exception,
      );
    }

    response.status(status).send({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      ...(process.env.NODE_ENV !== 'production' &&
        exception instanceof Error && { stack: exception.stack }),
    });
  }

  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') return body;

    const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'authorization'];
    const sanitized = { ...body };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeBody(sanitized[key]);
      }
    }

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const safeHeaders: Record<string, any> = {};
    const allowedHeaders = [
      'content-type',
      'content-length',
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding',
      'referer',
      'origin',
    ];

    for (const header of allowedHeaders) {
      if (headers[header]) {
        safeHeaders[header] = headers[header];
      }
    }

    return safeHeaders;
  }
}