import { Module, Global } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { BugsnagService } from './bugsnag.service';
import { BugsnagExceptionFilter } from './bugsnag.filter';

@Global()
@Module({
  providers: [
    BugsnagService,
    {
      provide: APP_FILTER,
      useClass: BugsnagExceptionFilter,
    },
  ],
  exports: [BugsnagService],
})
export class BugsnagModule {}