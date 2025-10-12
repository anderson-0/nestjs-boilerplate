import { Test, TestingModule } from '@nestjs/testing';
import { MongooseTodoRepository } from './mongoose-todo.repository';
import { Model } from 'mongoose';
import { Todo } from '../../common/entities/todo.entity';

describe('MongooseTodoRepository', () => {
  let repository: MongooseTodoRepository;
  let todoModel: jest.Mocked<Model<any>>;

  const mockTodo = {
    _id: '1',
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium' as const,
    tags: ['test'],
    metadata: { key: 'value' },
    createdAt: new Date('2025-10-11T21:21:58.243Z'),
    updatedAt: new Date('2025-10-11T21:21:58.243Z'),
    toObject: jest.fn().mockReturnThis(),
  };

  const mockTodoModel = {
    new: jest.fn().mockResolvedValue(mockTodo),
    constructor: jest.fn().mockResolvedValue(mockTodo),
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    deleteMany: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    repository = new MongooseTodoRepository(mockTodoModel as any);
    todoModel = mockTodoModel as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const createData = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high' as const,
        tags: ['new'],
      };

      const createdTodo = {
        ...mockTodo,
        ...createData,
        toObject: jest.fn().mockReturnValue({ ...mockTodo, ...createData }),
      };

      mockTodoModel.create.mockResolvedValue(createdTodo);

      const result = await repository.create(createData);

      expect(todoModel.create).toHaveBeenCalledWith(createData);
      expect(result).toEqual(expect.objectContaining({
        title: createData.title,
        description: createData.description,
        priority: createData.priority,
        tags: createData.tags,
      }));
    });

    it('should handle metadata', async () => {
      const createDataWithMetadata = {
        title: 'New Todo',
        metadata: { custom: 'data' },
      };

      const createdTodo = {
        ...mockTodo,
        ...createDataWithMetadata,
        toObject: jest.fn().mockReturnValue({ ...mockTodo, ...createDataWithMetadata }),
      };

      mockTodoModel.create.mockResolvedValue(createdTodo);

      const result = await repository.create(createDataWithMetadata);

      expect(result.metadata).toEqual({ custom: 'data' });
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([{
          ...mockTodo,
          toObject: jest.fn().mockReturnValue(mockTodo),
        }]),
      };

      mockTodoModel.find.mockReturnValue(mockQuery);

      const result = await repository.findAll();

      expect(todoModel.find).toHaveBeenCalled();
      expect(result).toEqual([expect.objectContaining({
        id: mockTodo.id,
        title: mockTodo.title,
      })]);
    });

    it('should return empty array when no todos exist', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([]),
      };

      mockTodoModel.find.mockReturnValue(mockQuery);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a todo by id', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue({
          ...mockTodo,
          toObject: jest.fn().mockReturnValue(mockTodo),
        }),
      };

      mockTodoModel.findById.mockReturnValue(mockQuery);

      const result = await repository.findById('1');

      expect(todoModel.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(expect.objectContaining({
        id: mockTodo.id,
        title: mockTodo.title,
      }));
    });

    it('should return null if todo not found', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue(null),
      };

      mockTodoModel.findById.mockReturnValue(mockQuery);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const updateData = { title: 'Updated Title', completed: true };
      const updatedTodo = {
        ...mockTodo,
        ...updateData,
        toObject: jest.fn().mockReturnValue({ ...mockTodo, ...updateData }),
      };

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(updatedTodo),
      };

      mockTodoModel.findByIdAndUpdate.mockReturnValue(mockQuery);

      const result = await repository.update('1', updateData);

      expect(todoModel.findByIdAndUpdate).toHaveBeenCalledWith(
        '1',
        { ...updateData, updatedAt: expect.any(Date) },
        { new: true }
      );
      expect(result).toEqual(expect.objectContaining(updateData));
    });
  });

  describe('delete', () => {
    it('should delete a todo', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue({
          ...mockTodo,
          toObject: jest.fn().mockReturnValue(mockTodo),
        }),
      };

      mockTodoModel.findByIdAndDelete.mockReturnValue(mockQuery);

      const result = await repository.delete('1');

      expect(todoModel.findByIdAndDelete).toHaveBeenCalledWith('1');
      expect(result).toEqual(expect.objectContaining({
        id: mockTodo.id,
      }));
    });
  });

  describe('deleteAll', () => {
    it('should delete all todos', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue({ deletedCount: 5 }),
      };

      mockTodoModel.deleteMany.mockReturnValue(mockQuery);

      await repository.deleteAll();

      expect(todoModel.deleteMany).toHaveBeenCalledWith({});
    });
  });

  describe('findByCompleted', () => {
    it('should find todos by completion status', async () => {
      const completedTodos = [{
        ...mockTodo,
        completed: true,
        toObject: jest.fn().mockReturnValue({ ...mockTodo, completed: true }),
      }];

      const mockQuery = {
        exec: jest.fn().mockResolvedValue(completedTodos),
      };

      mockTodoModel.find.mockReturnValue(mockQuery);

      const result = await repository.findByCompleted(true);

      expect(todoModel.find).toHaveBeenCalledWith({ completed: true });
      expect(result).toEqual([expect.objectContaining({
        completed: true,
      })]);
    });
  });

  describe('findByTags', () => {
    it('should find todos by tags', async () => {
      const tags = ['test', 'unit'];
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([{
          ...mockTodo,
          toObject: jest.fn().mockReturnValue(mockTodo),
        }]),
      };

      mockTodoModel.find.mockReturnValue(mockQuery);

      const result = await repository.findByTags(tags);

      expect(todoModel.find).toHaveBeenCalledWith({
        tags: { $in: tags },
      });
      expect(result).toEqual([expect.objectContaining({
        id: mockTodo.id,
      })]);
    });

    it('should return empty array for empty tags', async () => {
      const mockQuery = {
        exec: jest.fn().mockResolvedValue([]),
      };

      mockTodoModel.find.mockReturnValue(mockQuery);

      const result = await repository.findByTags([]);

      expect(todoModel.find).toHaveBeenCalledWith({
        tags: { $in: [] },
      });
      expect(result).toEqual([]);
    });
  });
});