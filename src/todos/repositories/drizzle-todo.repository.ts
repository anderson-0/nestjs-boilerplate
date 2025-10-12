import { Injectable } from '@nestjs/common';
import { eq, and, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../common/repositories/drizzle/drizzle.service';
import { todos } from '../../common/repositories/drizzle/schema';
import { ITodoRepository } from './todo.repository.interface';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../../common/entities/todo.entity';
import { createId } from '@paralleldrive/cuid2';

@Injectable()
export class DrizzleTodoRepository implements ITodoRepository {
  constructor(private readonly drizzle: DrizzleService) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const newTodo = {
      id: createId(),
      ...data,
      tags: data.tags || [],
      completed: data.completed ?? false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [created] = await this.drizzle.db
      .insert(todos)
      .values(newTodo)
      .returning();

    return created as Todo;
  }

  async findAll(): Promise<Todo[]> {
    const result = await this.drizzle.db
      .select()
      .from(todos)
      .orderBy(todos.createdAt);

    return result as Todo[];
  }

  async findById(id: string): Promise<Todo | null> {
    const [result] = await this.drizzle.db
      .select()
      .from(todos)
      .where(eq(todos.id, id));

    return (result as Todo) || null;
  }

  async update(id: string, data: UpdateTodoInput): Promise<Todo> {
    const [updated] = await this.drizzle.db
      .update(todos)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(todos.id, id))
      .returning();

    return updated as Todo;
  }

  async delete(id: string): Promise<Todo> {
    const [deleted] = await this.drizzle.db
      .delete(todos)
      .where(eq(todos.id, id))
      .returning();

    return deleted as Todo;
  }

  async deleteAll(): Promise<void> {
    await this.drizzle.db.delete(todos);
  }

  async findByCompleted(completed: boolean): Promise<Todo[]> {
    const result = await this.drizzle.db
      .select()
      .from(todos)
      .where(eq(todos.completed, completed))
      .orderBy(todos.createdAt);

    return result as Todo[];
  }

  async findByTags(tags: string[]): Promise<Todo[]> {
    // Note: This is a simplified implementation
    // For more complex array operations, you might need custom SQL
    const result = await this.drizzle.db
      .select()
      .from(todos)
      .orderBy(todos.createdAt);

    // Filter in memory for now (in production, use proper SQL array operations)
    return result.filter((todo) =>
      tags.some(tag => todo.tags.includes(tag))
    ) as Todo[];
  }
}