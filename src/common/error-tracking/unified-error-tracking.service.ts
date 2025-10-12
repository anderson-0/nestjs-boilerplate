import { Injectable, Logger } from '@nestjs/common';
import { FeatureFlagsService } from '../config/feature-flags.config';
import { ErrorTrackingProvider } from '../config/feature-providers.enum';
import { BugsnagService } from '../bugsnag/bugsnag.service';
import { SentryService } from './sentry/sentry.service';
import { PostHogService } from './posthog/posthog.service';
import { IErrorTrackingService, ErrorMetadata } from './error-tracking.interface';

@Injectable()
export class UnifiedErrorTrackingService implements IErrorTrackingService {
  private readonly logger = new Logger(UnifiedErrorTrackingService.name);
  private activeService: IErrorTrackingService | null = null;

  constructor(
    private readonly featureFlags: FeatureFlagsService,
    private readonly bugsnagService: BugsnagService,
    private readonly sentryService: SentryService,
    private readonly postHogService: PostHogService,
  ) {
    this.initializeService();
  }

  private initializeService(): void {
    if (!this.featureFlags.isErrorTrackingEnabled()) {
      this.logger.log('Error tracking is disabled via feature flags');
      return;
    }

    const provider = this.featureFlags.getErrorTrackingProvider();

    switch (provider) {
      case ErrorTrackingProvider.BUGSNAG:
        this.activeService = this.bugsnagService;
        break;
      case ErrorTrackingProvider.SENTRY:
        this.activeService = this.sentryService;
        break;
      case ErrorTrackingProvider.POSTHOG:
        this.activeService = this.postHogService;
        break;
      case ErrorTrackingProvider.NONE:
      default:
        this.logger.log('No error tracking provider configured');
        this.activeService = null;
        return;
    }

    this.logger.log(`Initialized error tracking with provider: ${provider}`);
  }

  isReady(): boolean {
    return this.activeService?.isReady() ?? false;
  }

  captureException(error: Error, metadata?: Record<string, any>): void {
    if (!this.activeService) {
      this.logger.debug('No error tracking service available');
      return;
    }

    try {
      this.activeService.captureException(error, metadata);
    } catch (err) {
      this.logger.error('Failed to capture exception:', err);
    }
  }

  captureMessage(
    message: string,
    level: string = 'info',
    metadata?: Record<string, any>,
  ): void {
    if (!this.activeService) {
      this.logger.debug('No error tracking service available');
      return;
    }

    try {
      if (this.activeService.captureMessage) {
        this.activeService.captureMessage(message, level, metadata);
      } else {
        // Fallback for services that don't have captureMessage
        this.captureException(new Error(message), metadata);
      }
    } catch (err) {
      this.logger.error('Failed to capture message:', err);
    }
  }

  setUser(userId: string, email?: string, name?: string): void {
    if (!this.activeService) return;

    try {
      this.activeService.setUser(userId, email, name);
    } catch (err) {
      this.logger.error('Failed to set user:', err);
    }
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
    if (!this.activeService) return;

    try {
      if (this.activeService.addBreadcrumb) {
        this.activeService.addBreadcrumb(message, category, data);
      }
    } catch (err) {
      this.logger.error('Failed to add breadcrumb:', err);
    }
  }

  async flush(): Promise<void> {
    if (!this.activeService) return;

    try {
      if (this.activeService.flush) {
        await this.activeService.flush();
      }
    } catch (err) {
      this.logger.error('Failed to flush error tracking service:', err);
    }
  }

  // Convenience methods
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.addBreadcrumb(`HTTP ${method} ${url} - ${statusCode}`, 'http', {
      method,
      url,
      statusCode,
      userId,
      ...metadata,
    });
  }

  logControllerAction(
    controller: string,
    action: string,
    userId?: string,
    metadata?: Record<string, any>,
  ): void {
    this.addBreadcrumb(`${controller}.${action}`, 'navigation', {
      controller,
      action,
      userId,
      ...metadata,
    });
  }

  captureHttpException(
    error: Error,
    request: any,
    response: any,
    userId?: string,
  ): void {
    const metadata: ErrorMetadata = {
      request: {
        method: request.method,
        url: request.url,
        query: request.query,
        params: request.params,
        body: this.sanitizeBody(request.body),
        headers: this.sanitizeHeaders(request.headers),
        ip: request.ip,
        userAgent: request.headers?.['user-agent'],
      },
      response: {
        statusCode: response.statusCode || 500,
        message: error.message,
      },
      user: userId ? { id: userId } : undefined,
      timestamp: new Date().toISOString(),
    };

    this.captureException(error, metadata);
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
      if (headers?.[header]) {
        safeHeaders[header] = headers[header];
      }
    }

    return safeHeaders;
  }

  // Provider-specific features
  getActiveProvider(): ErrorTrackingProvider {
    return this.featureFlags.getErrorTrackingProvider();
  }

  isProviderReady(provider: ErrorTrackingProvider): boolean {
    switch (provider) {
      case ErrorTrackingProvider.BUGSNAG:
        return this.bugsnagService.isInitialized();
      case ErrorTrackingProvider.SENTRY:
        return this.sentryService.isReady();
      case ErrorTrackingProvider.POSTHOG:
        return this.postHogService.isReady();
      default:
        return false;
    }
  }

  // Analytics methods (for PostHog)
  trackEvent(event: string, userId: string, properties?: Record<string, any>): void {
    if (this.getActiveProvider() === ErrorTrackingProvider.POSTHOG && this.postHogService.isReady()) {
      this.postHogService.captureEvent(event, userId, properties);
    }
  }

  trackApiCall(
    userId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    duration?: number,
  ): void {
    if (this.getActiveProvider() === ErrorTrackingProvider.POSTHOG && this.postHogService.isReady()) {
      this.postHogService.trackApiCall(userId, method, endpoint, statusCode, duration);
    }
  }
}