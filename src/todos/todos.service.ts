import { Injectable, Inject } from '@nestjs/common';
import { ITodoRepository } from './repositories/todo.repository.interface';
import { CreateTodoInput, UpdateTodoInput, Todo } from '../common/entities/todo.entity';

@Injectable()
export class TodosService {
  constructor(
    @Inject('TODO_REPOSITORY')
    private readonly todoRepository: ITodoRepository,
  ) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    return this.todoRepository.create(data);
  }

  async findAll(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  async findById(id: string): Promise<Todo | null> {
    return this.todoRepository.findById(id);
  }

  async update(id: string, data: UpdateTodoInput): Promise<Todo> {
    return this.todoRepository.update(id, data);
  }

  async delete(id: string): Promise<Todo> {
    return this.todoRepository.delete(id);
  }

  async findByCompleted(completed: boolean): Promise<Todo[]> {
    return this.todoRepository.findByCompleted(completed);
  }

  async findByTags(tags: string[]): Promise<Todo[]> {
    return this.todoRepository.findByTags(tags);
  }
}