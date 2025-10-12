import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class PostHogService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PostHogService.name);
  private client: PostHog | null = null;
  private isInitialized = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get('POSTHOG_API_KEY');
    const host = this.configService.get('POSTHOG_HOST', 'https://app.posthog.com');

    if (!apiKey || apiKey === 'your-posthog-api-key-here') {
      this.logger.warn('PostHog API key not found or using placeholder. Analytics and error tracking is disabled.');
      return;
    }

    try {
      this.client = new PostHog(apiKey, {
        host,
        flushAt: 20,
        flushInterval: 10000,
      });

      this.isInitialized = true;
      this.logger.log('PostHog initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PostHog:', error);
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.shutdown();
    }
  }

  isReady(): boolean {
    return this.isInitialized && this.client !== null;
  }

  captureException(error: Error, metadata?: Record<string, any>): void {
    if (!this.isReady()) {
      this.logger.warn('PostHog not initialized. Skipping error capture.');
      return;
    }

    try {
      // Extract userId from metadata if available, otherwise use anonymous
      const userId = metadata?.userId || 'anonymous';

      this.client!.capture({
        distinctId: userId,
        event: 'error_occurred',
        properties: {
          error_name: error.name,
          error_message: error.message,
          error_stack: error.stack,
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      });
    } catch (err) {
      this.logger.error('Failed to capture exception in PostHog:', err);
    }
  }

  captureExceptionWithUserId(error: Error, userId?: string, metadata?: Record<string, any>): void {
    this.captureException(error, { ...metadata, userId });
  }

  captureEvent(
    event: string,
    userId: string,
    properties?: Record<string, any>,
  ): void {
    if (!this.isReady()) {
      this.logger.warn('PostHog not initialized. Skipping event capture.');
      return;
    }

    try {
      this.client!.capture({
        distinctId: userId,
        event,
        properties: {
          timestamp: new Date().toISOString(),
          ...properties,
        },
      });
    } catch (err) {
      this.logger.error('Failed to capture event in PostHog:', err);
    }
  }

  setUser(userId: string, email?: string, name?: string): void {
    this.identifyUser(userId, { email, name });
  }

  identifyUser(
    userId: string,
    properties?: {
      email?: string;
      name?: string;
      [key: string]: any;
    },
  ): void {
    if (!this.isReady()) return;

    try {
      this.client!.identify({
        distinctId: userId,
        properties: {
          ...properties,
          $set: properties,
        },
      });
    } catch (error) {
      this.logger.error('Failed to identify user in PostHog:', error);
    }
  }

  setPersonProperties(userId: string, properties: Record<string, any>): void {
    if (!this.isReady()) return;

    try {
      this.client!.capture({
        distinctId: userId,
        event: '$set',
        properties: {
          $set: properties,
        },
      });
    } catch (error) {
      this.logger.error('Failed to set person properties in PostHog:', error);
    }
  }

  async flush(): Promise<void> {
    if (!this.isReady()) return;

    try {
      await this.client!.flush();
    } catch (error) {
      this.logger.error('Failed to flush PostHog:', error);
    }
  }

  // Analytics specific methods
  trackPageView(userId: string, path: string, properties?: Record<string, any>): void {
    this.captureEvent('$pageview', userId, {
      $current_url: path,
      ...properties,
    });
  }

  trackApiCall(
    userId: string,
    method: string,
    endpoint: string,
    statusCode: number,
    duration?: number,
    properties?: Record<string, any>,
  ): void {
    this.captureEvent('api_call', userId, {
      method,
      endpoint,
      status_code: statusCode,
      duration_ms: duration,
      ...properties,
    });
  }

  trackFeatureUsage(
    userId: string,
    feature: string,
    properties?: Record<string, any>,
  ): void {
    this.captureEvent('feature_used', userId, {
      feature_name: feature,
      ...properties,
    });
  }
}