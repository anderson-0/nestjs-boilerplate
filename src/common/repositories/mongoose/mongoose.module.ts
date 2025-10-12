import { Module } from '@nestjs/common';
import { MongooseModule as NestMongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MongooseService } from './mongoose.service';
import { TodoSchema } from './schemas/todo.schema';

@Module({
  imports: [
    NestMongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => {
        const mongoUrl = configService.get<string>('MONGODB_URL');

        if (!mongoUrl) {
          throw new Error('MONGODB_URL is required when using Mongoose');
        }

        return {
          uri: mongoUrl,
          connectionFactory: (connection) => {
            // Add any connection-level middleware or plugins here
            return connection;
          },
          // Connection options
          maxPoolSize: 10, // Maintain up to 10 socket connections
          serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
          socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
          retryWrites: true,
          retryReads: true,
        };
      },
      inject: [ConfigService],
    }),
    NestMongooseModule.forFeature([
      { name: 'Todo', schema: TodoSchema },
    ]),
  ],
  providers: [MongooseService],
  exports: [MongooseService, NestMongooseModule],
})
export class MongooseModule {}