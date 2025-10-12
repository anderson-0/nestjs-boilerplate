import { Test, TestingModule } from '@nestjs/testing';
import { DrizzleTodoRepository } from './drizzle-todo.repository';
import { DrizzleService } from '../../common/repositories/drizzle/drizzle.service';
import { Todo } from '../../common/entities/todo.entity';

describe('DrizzleTodoRepository', () => {
  let repository: DrizzleTodoRepository;
  let drizzleService: jest.Mocked<DrizzleService>;

  const mockTodo = {
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium' as const,
    tags: ['test'],
    metadata: { key: 'value' },
    createdAt: new Date('2025-10-11T21:21:58.243Z'),
    updatedAt: new Date('2025-10-11T21:21:58.243Z'),
  };

  const mockDb = {
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  const mockDrizzleService = {
    db: mockDb,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DrizzleTodoRepository,
        {
          provide: DrizzleService,
          useValue: mockDrizzleService,
        },
      ],
    }).compile();

    repository = module.get<DrizzleTodoRepository>(DrizzleTodoRepository);
    drizzleService = module.get<DrizzleService>(DrizzleService) as jest.Mocked<DrizzleService>;
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

      mockDb.returning.mockResolvedValue([mockTodo]);

      const result = await repository.create(createData);

      expect(mockDb.insert).toHaveBeenCalled();
      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          title: createData.title,
          description: createData.description,
          priority: createData.priority,
          tags: createData.tags,
        })
      );
      expect(result).toEqual(mockTodo);
    });

    it('should handle metadata conversion', async () => {
      const createDataWithMetadata = {
        title: 'New Todo',
        metadata: { custom: 'data' },
      };

      const mockTodoWithMetadata = {
        ...mockTodo,
        metadata: { custom: 'data' },
      };

      mockDb.returning.mockResolvedValue([mockTodoWithMetadata]);

      const result = await repository.create(createDataWithMetadata);

      expect(result.metadata).toEqual({ custom: 'data' });
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      mockDb.orderBy.mockResolvedValue([mockTodo]);

      const result = await repository.findAll();

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual([mockTodo]);
    });

    it('should return empty array when no todos exist', async () => {
      mockDb.orderBy.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a todo by id', async () => {
      mockDb.where.mockResolvedValue([mockTodo]);

      const result = await repository.findById('1');

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockTodo);
    });

    it('should return null if todo not found', async () => {
      mockDb.where.mockResolvedValue([]);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const updateData = { title: 'Updated Title', completed: true };
      const updatedTodo = { ...mockTodo, ...updateData };

      mockDb.returning.mockResolvedValue([updatedTodo]);

      const result = await repository.update('1', updateData);

      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining(updateData)
      );
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(updatedTodo);
    });
  });

  describe('delete', () => {
    it('should delete a todo', async () => {
      mockDb.returning.mockResolvedValue([mockTodo]);

      const result = await repository.delete('1');

      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(result).toEqual(mockTodo);
    });
  });

  describe('deleteAll', () => {
    it('should delete all todos', async () => {
      mockDb.delete.mockResolvedValue({ rowCount: 5 });

      await repository.deleteAll();

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });

  describe('findByCompleted', () => {
    it('should find todos by completion status', async () => {
      const completedTodos = [{ ...mockTodo, completed: true }];
      mockDb.orderBy.mockResolvedValue(completedTodos);

      const result = await repository.findByCompleted(true);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.where).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual(completedTodos);
    });
  });

  describe('findByTags', () => {
    it('should find todos by tags', async () => {
      const tags = ['test', 'unit'];
      mockDb.orderBy.mockResolvedValue([mockTodo]);

      const result = await repository.findByTags(tags);

      expect(mockDb.select).toHaveBeenCalled();
      expect(mockDb.from).toHaveBeenCalled();
      expect(mockDb.orderBy).toHaveBeenCalled();
      expect(result).toEqual([mockTodo]);
    });

    it('should return empty array for empty tags', async () => {
      mockDb.orderBy.mockResolvedValue([]);

      const result = await repository.findByTags([]);

      expect(result).toEqual([]);
    });
  });
});