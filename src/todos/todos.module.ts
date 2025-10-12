import { Module } from '@nestjs/common';
import { TodosService } from './todos.service';
import { TodosController } from './todos.controller';
import { createRepositoryProvider } from '../common/repositories/repository.provider';
import { PrismaTodoRepository } from './repositories/prisma-todo.repository';
import { DrizzleTodoRepository } from './repositories/drizzle-todo.repository';
import { MongooseTodoRepository } from './repositories/mongoose-todo.repository';
import { ITodoRepository } from './repositories/todo.repository.interface';
import { PrismaService } from '../common/repositories/prisma/prisma.service';
import { DrizzleService } from '../common/repositories/drizzle/drizzle.service';
import { getModelToken } from '@nestjs/mongoose';

@Module({
  controllers: [TodosController],
  providers: [
    TodosService,
    createRepositoryProvider<ITodoRepository>({
      provide: 'TODO_REPOSITORY',
      prismaRepository: PrismaTodoRepository,
      drizzleRepository: DrizzleTodoRepository,
      mongooseRepository: MongooseTodoRepository,
    }),
    // Repository implementations that need dependencies
    {
      provide: PrismaTodoRepository,
      useFactory: (prismaService: PrismaService) => new PrismaTodoRepository(prismaService),
      inject: [PrismaService],
    },
    {
      provide: DrizzleTodoRepository,
      useFactory: (drizzleService: DrizzleService) => new DrizzleTodoRepository(drizzleService),
      inject: [DrizzleService],
    },
    {
      provide: MongooseTodoRepository,
      useFactory: (todoModel: any) => new MongooseTodoRepository(todoModel),
      inject: [getModelToken('Todo')],
    },
  ],
  exports: [TodosService],
})
export class TodosModule {}