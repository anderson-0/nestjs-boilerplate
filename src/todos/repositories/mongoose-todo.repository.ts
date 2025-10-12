import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITodoRepository } from './todo.repository.interface';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../../common/entities/todo.entity';
import { TodoDocument } from '../../common/repositories/mongoose/schemas/todo.schema';

@Injectable()
export class MongooseTodoRepository implements ITodoRepository {
  constructor(
    @InjectModel('Todo') private readonly todoModel: Model<TodoDocument>,
  ) {}

  async create(data: CreateTodoInput): Promise<Todo> {
    const created = new this.todoModel({
      ...data,
      tags: data.tags || [],
      completed: data.completed ?? false,
    });

    const saved = await created.save();
    return this.mapDocumentToEntity(saved);
  }

  async findAll(): Promise<Todo[]> {
    const todos = await this.todoModel
      .find()
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = await this.todoModel
      .findOne({ cuid: id })
      .exec();

    if (!todo) return null;

    return this.mapDocumentToEntity(todo);
  }

  async update(id: string, data: UpdateTodoInput): Promise<Todo> {
    const updated = await this.todoModel
      .findOneAndUpdate(
        { cuid: id },
        { $set: data },
        { new: true, runValidators: true }
      )
      .exec();

    if (!updated) {
      throw new Error(`Todo with id ${id} not found`);
    }

    return this.mapDocumentToEntity(updated);
  }

  async delete(id: string): Promise<Todo> {
    const deleted = await this.todoModel
      .findOneAndDelete({ cuid: id })
      .exec();

    if (!deleted) {
      throw new Error(`Todo with id ${id} not found`);
    }

    return this.mapDocumentToEntity(deleted);
  }

  async deleteAll(): Promise<void> {
    await this.todoModel.deleteMany({}).exec();
  }

  async findByCompleted(completed: boolean): Promise<Todo[]> {
    const todos = await this.todoModel
      .find({ completed })
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async findByTags(tags: string[]): Promise<Todo[]> {
    const todos = await this.todoModel
      .find({ tags: { $in: tags } })
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async findByPriority(priority: 'low' | 'medium' | 'high'): Promise<Todo[]> {
    const todos = await this.todoModel
      .find({ priority })
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async findByDueDateRange(startDate?: Date, endDate?: Date): Promise<Todo[]> {
    const query: any = {};

    if (startDate || endDate) {
      query.dueDate = {};
      if (startDate) query.dueDate.$gte = startDate;
      if (endDate) query.dueDate.$lte = endDate;
    }

    const todos = await this.todoModel
      .find(query)
      .sort({ dueDate: 1, createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async findOverdue(): Promise<Todo[]> {
    const now = new Date();
    const todos = await this.todoModel
      .find({
        dueDate: { $lt: now },
        completed: false,
      })
      .sort({ dueDate: 1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  async count(): Promise<number> {
    return this.todoModel.countDocuments().exec();
  }

  async countByCompleted(completed: boolean): Promise<number> {
    return this.todoModel.countDocuments({ completed }).exec();
  }

  async search(query: string): Promise<Todo[]> {
    const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

    const todos = await this.todoModel
      .find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { tags: { $in: [searchRegex] } },
        ],
      })
      .sort({ createdAt: -1 })
      .exec();

    return todos.map(todo => this.mapDocumentToEntity(todo));
  }

  private mapDocumentToEntity(doc: TodoDocument): Todo {
    return {
      id: doc.cuid,
      title: doc.title,
      description: doc.description,
      completed: doc.completed,
      priority: doc.priority,
      tags: doc.tags,
      dueDate: doc.dueDate,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    } as Todo;
  }
}