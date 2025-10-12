import { Module, Global, DynamicModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { DrizzleModule } from './drizzle/drizzle.module';
import { MongooseModule } from './mongoose/mongoose.module';
import { RepositoryFactoryService } from './repository.factory';
import { FeatureFlagsService } from '../config/feature-flags.config';
import { DatabaseProvider } from '../config/feature-providers.enum';

@Global()
@Module({})
export class RepositoryModule {
  static forRoot(): DynamicModule {
    return {
      module: RepositoryModule,
      imports: [
        ConfigModule,
        PrismaModule,
        DrizzleModule,
        MongooseModule,
      ],
      providers: [
        {
          provide: 'DATABASE_PROVIDER',
          useFactory: (featureFlagsService: FeatureFlagsService) => {
            const databaseProvider = featureFlagsService.getDatabaseProvider();
            console.log(`🗄️  Using database provider: ${databaseProvider}`);
            return databaseProvider;
          },
          inject: [FeatureFlagsService],
        },
        RepositoryFactoryService,
      ],
      exports: [
        'DATABASE_PROVIDER',
        RepositoryFactoryService,
        PrismaModule,
        DrizzleModule,
        MongooseModule,
      ],
    };
  }
}