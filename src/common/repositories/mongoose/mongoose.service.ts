import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class MongooseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongooseService.name);

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Connection is already established by MongooseModule
      this.logger.log('✅ MongoDB connected successfully');
      this.logger.log(`📦 Database: ${this.connection.db?.databaseName}`);
      this.logger.log(`🔗 Host: ${this.connection.host}:${this.connection.port}`);
    } catch (error) {
      this.logger.error('❌ MongoDB connection failed', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.connection.close();
      this.logger.log('📤 MongoDB connection closed');
    } catch (error) {
      this.logger.error('❌ Error closing MongoDB connection', error);
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  async isConnected(): Promise<boolean> {
    return this.connection.readyState === 1;
  }

  async ping(): Promise<boolean> {
    try {
      await this.connection.db?.admin().ping();
      return true;
    } catch (error) {
      this.logger.error('MongoDB ping failed', error);
      return false;
    }
  }

  getDatabaseName(): string {
    return this.connection.db?.databaseName || 'unknown';
  }

  getConnectionInfo(): {
    host: string;
    port: number;
    database: string;
    connected: boolean;
  } {
    return {
      host: this.connection.host || 'unknown',
      port: this.connection.port || 0,
      database: this.getDatabaseName(),
      connected: this.connection.readyState === 1,
    };
  }
}