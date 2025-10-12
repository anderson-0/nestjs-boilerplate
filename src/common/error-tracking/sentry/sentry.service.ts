import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

@Injectable()
export class SentryService implements OnModuleInit {
  private readonly logger = new Logger(SentryService.name);
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const dsn = this.configService.get('SENTRY_DSN');
    const environment = this.configService.get('NODE_ENV') || 'development';
    const release = this.configService.get('APP_VERSION') || '1.0.0';

    if (!dsn || dsn === 'your-sentry-dsn-here') {
      this.logger.warn('Sentry DSN not found or using placeholder. Error tracking is disabled.');
      return;
    }

    try {
      Sentry.init({
        dsn,
        environment,
        release,
        integrations: [
          nodeProfilingIntegration(),
          Sentry.httpIntegration(),
          Sentry.expressIntegration(),
        ],
        tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
        profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
        beforeSend(event) {
          // Add custom logic here if needed
          return event;
        },
      });

      this.isInitialized = true;
      this.logger.log(`Sentry initialized for ${environment} environment`);
    } catch (error) {
      this.logger.error('Failed to initialize Sentry:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  captureException(error: Error, metadata?: Record<string, any>): void {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Skipping error capture.');
      return;
    }

    try {
      Sentry.withScope((scope) => {
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }
        Sentry.captureException(error);
      });
    } catch (err) {
      this.logger.error('Failed to capture exception in Sentry:', err);
    }
  }

  captureMessage(
    message: string,
    level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
    metadata?: Record<string, any>,
  ): void {
    if (!this.isInitialized) {
      this.logger.warn('Sentry not initialized. Skipping message capture.');
      return;
    }

    try {
      Sentry.withScope((scope) => {
        scope.setLevel(level);
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            scope.setContext(key, value);
          });
        }
        Sentry.captureMessage(message);
      });
    } catch (err) {
      this.logger.error('Failed to capture message in Sentry:', err);
    }
  }

  setUser(userId: string, email?: string, username?: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setUser({
        id: userId,
        email,
        username,
      });
    } catch (error) {
      this.logger.error('Failed to set user in Sentry:', error);
    }
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
    if (!this.isInitialized) return;

    try {
      Sentry.addBreadcrumb({
        message,
        category: category || 'default',
        data,
        timestamp: Date.now() / 1000,
      });
    } catch (error) {
      this.logger.error('Failed to add breadcrumb in Sentry:', error);
    }
  }

  setTag(key: string, value: string): void {
    if (!this.isInitialized) return;

    try {
      Sentry.setTag(key, value);
    } catch (error) {
      this.logger.error('Failed to set tag in Sentry:', error);
    }
  }

  flush(timeout?: number): Promise<boolean> {
    if (!this.isInitialized) return Promise.resolve(false);

    return Sentry.flush(timeout);
  }
}