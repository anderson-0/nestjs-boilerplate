import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { BugsnagService } from '../bugsnag/bugsnag.service';
import { SentryService } from './sentry/sentry.service';
import { PostHogService } from './posthog/posthog.service';
import { UnifiedErrorTrackingService } from './unified-error-tracking.service';
import { UnifiedExceptionFilter } from './unified-exception.filter';
import { FeatureFlagsService } from '../config/feature-flags.config';

@Global()
@Module({
  providers: [
    FeatureFlagsService,
    BugsnagService,
    SentryService,
    PostHogService,
    UnifiedErrorTrackingService,
    {
      provide: APP_FILTER,
      useClass: UnifiedExceptionFilter,
    },
  ],
  exports: [
    UnifiedErrorTrackingService,
    BugsnagService,
    SentryService,
    PostHogService,
    FeatureFlagsService,
  ],
})
export class ErrorTrackingModule {}