import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Bugsnag from '@bugsnag/js';
import type { Client, Event, NotifiableError } from '@bugsnag/js';
import { IErrorTrackingService } from '../error-tracking/error-tracking.interface';

@Injectable()
export class BugsnagService implements OnModuleInit, IErrorTrackingService {
  private readonly logger = new Logger(BugsnagService.name);
  private client: Client | null = null;
  private isEnabled: boolean = false;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const apiKey = this.configService.get('BUGSNAG_API_KEY');
    const releaseStage = this.configService.get('NODE_ENV') || 'development';
    const appVersion = this.configService.get('APP_VERSION') || '1.0.0';

    if (!apiKey || apiKey === 'test-bugsnag-key') {
      this.logger.warn('Bugsnag API key not found or using test key. Error tracking is disabled.');
      return;
    }

    try {
      this.client = Bugsnag.start({
        apiKey,
        releaseStage,
        appVersion,
        enabledReleaseStages: ['production', 'staging'],
        autoDetectErrors: true,
        autoTrackSessions: true,
        onError: (event: Event) => {
          event.addMetadata('app', {
            environment: releaseStage,
            version: appVersion,
          });
          return true;
        },
      });

      this.isEnabled = true;
      this.logger.log(`Bugsnag initialized for ${releaseStage} environment`);
    } catch (error) {
      this.logger.error('Failed to initialize Bugsnag:', error);
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  isInitialized(): boolean {
    return this.isEnabled && this.client !== null;
  }

  // IErrorTrackingService implementation
  isReady(): boolean {
    return this.isInitialized();
  }

  captureException(error: Error, metadata?: Record<string, any>): void {
    this.notify(error, metadata);
  }

  notify(
    error: NotifiableError,
    metadata?: Record<string, any>,
    severity: 'error' | 'warning' | 'info' = 'error',
  ): void {
    if (!this.isInitialized()) {
      this.logger.warn('Bugsnag not initialized. Skipping error notification.');
      return;
    }

    try {
      this.client!.notify(error, (event) => {
        event.severity = severity;

        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            event.addMetadata(key, value);
          });
        }

        return true;
      });
    } catch (err) {
      this.logger.error('Failed to send error to Bugsnag:', err);
    }
  }

  setUser(userId: string, email?: string, name?: string): void {
    if (!this.isInitialized()) return;

    try {
      this.client!.setUser(userId, email, name);
    } catch (error) {
      this.logger.error('Failed to set user context:', error);
    }
  }

  addBreadcrumb(message: string, category?: string, data?: Record<string, any>): void {
    this.leaveBreadcrumb(message, data, (category as any) || 'manual');
  }

  leaveBreadcrumb(
    message: string,
    metadata?: Record<string, any>,
    type: 'navigation' | 'request' | 'process' | 'log' | 'user' | 'state' | 'error' | 'manual' = 'manual',
  ): void {
    if (!this.isInitialized()) return;

    try {
      this.client!.leaveBreadcrumb(message, {
        type,
        metadata,
      });
    } catch (error) {
      this.logger.error('Failed to leave breadcrumb:', error);
    }
  }
}