import { Injectable, Inject, Type } from '@nestjs/common';
import { DatabaseProvider } from '../config/feature-providers.enum';

export interface RepositoryFactory {
  createRepository<T>(
    prismaRepo?: Type<T>,
    drizzleRepo?: Type<T>,
    mongooseRepo?: Type<T>,
  ): T;
}

@Injectable()
export class RepositoryFactoryService implements RepositoryFactory {
  constructor(
    @Inject('DATABASE_PROVIDER') private readonly databaseProvider: DatabaseProvider,
  ) {}

  createRepository<T>(
    prismaRepo?: Type<T>,
    drizzleRepo?: Type<T>,
    mongooseRepo?: Type<T>,
  ): T {
    switch (this.databaseProvider) {
      case DatabaseProvider.PRISMA_POSTGRESQL:
        if (!prismaRepo) {
          throw new Error('Prisma repository not provided but required for prisma-postgresql provider');
        }
        return new prismaRepo() as T;

      case DatabaseProvider.DRIZZLE_POSTGRESQL:
        if (!drizzleRepo) {
          throw new Error('Drizzle repository not provided but required for drizzle-postgresql provider');
        }
        return new drizzleRepo() as T;

      case DatabaseProvider.MONGOOSE_MONGODB:
        if (!mongooseRepo) {
          throw new Error('Mongoose repository not provided but required for mongoose-mongodb provider');
        }
        return new mongooseRepo() as T;

      default:
        throw new Error(`Unknown database provider: ${this.databaseProvider}`);
    }
  }
}