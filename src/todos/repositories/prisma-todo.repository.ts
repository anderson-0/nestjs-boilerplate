import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/repositories/prisma/prisma.service';
import { ITodoRepository } from './todo.repository.interface';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../../common/entities/todo.entity';

@Injectable()
export class PrismaTodoRepository implements ITodoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const created = await this.prisma.todo.create({
      data: {
        ...data,
        tags: data.tags || [],
      },
    });

    return {
      ...created,
      metadata: created.metadata as Record<string, any> | undefined,
    } as Todo;
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return todos.map(todo => ({
      ...todo,
      metadata: todo.metadata as Record<string, any> | undefined,
    })) as Todo[];
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = await this.prisma.todo.findUnique({
      where: { id },
    });

    if (!todo) return null;

    return {
      ...todo,
      metadata: todo.metadata as Record<string, any> | undefined,
    } as Todo;
  }

  async update(id: string, data: UpdateTodoInput): Promise<Todo> {
    const updated = await this.prisma.todo.update({
      where: { id },
      data,
    });

    return {
      ...updated,
      metadata: updated.metadata as Record<string, any> | undefined,
    } as Todo;
  }

  async delete(id: string): Promise<Todo> {
    const deleted = await this.prisma.todo.delete({
      where: { id },
    });

    return {
      ...deleted,
      metadata: deleted.metadata as Record<string, any> | undefined,
    } as Todo;
  }

  async deleteAll(): Promise<void> {
    await this.prisma.todo.deleteMany();
  }

  async findByCompleted(completed: boolean): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      where: { completed },
      orderBy: { createdAt: 'desc' },
    });

    return todos.map(todo => ({
      ...todo,
      metadata: todo.metadata as Record<string, any> | undefined,
    })) as Todo[];
  }

  async findByTags(tags: string[]): Promise<Todo[]> {
    const todos = await this.prisma.todo.findMany({
      where: {
        tags: {
          hasSome: tags,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return todos.map(todo => ({
      ...todo,
      metadata: todo.metadata as Record<string, any> | undefined,
    })) as Todo[];
  }
}