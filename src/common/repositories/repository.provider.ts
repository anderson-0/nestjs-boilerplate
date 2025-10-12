import { Provider, Type } from '@nestjs/common';
import { DatabaseProvider } from '../config/feature-providers.enum';

export interface RepositoryProviderOptions<T> {
  provide: string | symbol;
  prismaRepository?: Type<T>;
  drizzleRepository?: Type<T>;
  mongooseRepository?: Type<T>;
}

export function createRepositoryProvider<T>(
  options: RepositoryProviderOptions<T>,
): Provider {
  return {
    provide: options.provide,
    useFactory: (databaseProvider: DatabaseProvider, ...dependencies: any[]) => {
      switch (databaseProvider) {
        case DatabaseProvider.PRISMA_POSTGRESQL:
          if (!options.prismaRepository) {
            throw new Error('Prisma repository not provided but required for prisma-postgresql provider');
          }
          return new options.prismaRepository(...dependencies);

        case DatabaseProvider.DRIZZLE_POSTGRESQL:
          if (!options.drizzleRepository) {
            throw new Error('Drizzle repository not provided but required for drizzle-postgresql provider');
          }
          return new options.drizzleRepository(...dependencies);

        case DatabaseProvider.MONGOOSE_MONGODB:
          if (!options.mongooseRepository) {
            throw new Error('Mongoose repository not provided but required for mongoose-mongodb provider');
          }
          return new options.mongooseRepository(...dependencies);

        default:
          throw new Error(`Unknown database provider: ${databaseProvider}`);
      }
    },
    inject: ['DATABASE_PROVIDER'],
  };
}