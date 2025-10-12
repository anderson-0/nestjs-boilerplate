import { Todo, CreateTodoInput, UpdateTodoInput } from '../../common/entities/todo.entity';
import { BaseRepository } from '../../common/repositories/repository.interface';

export interface ITodoRepository extends BaseRepository<Todo> {
  create(data: CreateTodoInput): Promise<Todo>;
  update(id: string, data: UpdateTodoInput): Promise<Todo>;
  findByCompleted(completed: boolean): Promise<Todo[]>;
  findByTags(tags: string[]): Promise<Todo[]>;
}