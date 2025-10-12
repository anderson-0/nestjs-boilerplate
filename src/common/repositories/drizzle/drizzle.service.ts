import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>('DATABASE_URL');

    this.pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = drizzle(this.pool, { schema });
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  getDb(): NodePgDatabase<typeof schema> {
    return this.db;
  }

  async cleanDatabase() {
    if (this.configService.get<string>('NODE_ENV') !== 'test') {
      throw new Error('cleanDatabase() can only be used in test environment');
    }

    try {
      await this.db.delete(schema.todos);
    } catch (error) {
      console.error('Error cleaning database:', error);
    }
  }
}