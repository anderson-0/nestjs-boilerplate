import { Test, TestingModule } from '@nestjs/testing';
import { PrismaTodoRepository } from './prisma-todo.repository';
import { PrismaService } from '../../common/repositories/prisma/prisma.service';
import { Todo } from '../../common/entities/todo.entity';

describe('PrismaTodoRepository', () => {
  let repository: PrismaTodoRepository;
  let prismaService: jest.Mocked<PrismaService>;

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

  const mockPrismaService = {
    todo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaTodoRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<PrismaTodoRepository>(PrismaTodoRepository);
    prismaService = module.get<PrismaService>(PrismaService) as jest.Mocked<PrismaService>;
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

      mockPrismaService.todo.create.mockResolvedValue(mockTodo);

      const result = await repository.create(createData);

      expect(prismaService.todo.create).toHaveBeenCalledWith({
        data: createData,
      });
      expect(result).toEqual({
        ...mockTodo,
        metadata: mockTodo.metadata,
      });
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

      mockPrismaService.todo.create.mockResolvedValue(mockTodoWithMetadata);

      const result = await repository.create(createDataWithMetadata);

      expect(result.metadata).toEqual({ custom: 'data' });
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      mockPrismaService.todo.findMany.mockResolvedValue([mockTodo]);

      const result = await repository.findAll();

      expect(prismaService.todo.findMany).toHaveBeenCalled();
      expect(result).toEqual([{
        ...mockTodo,
        metadata: mockTodo.metadata,
      }]);
    });

    it('should return empty array when no todos exist', async () => {
      mockPrismaService.todo.findMany.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findById', () => {
    it('should return a todo by id', async () => {
      mockPrismaService.todo.findUnique.mockResolvedValue(mockTodo);

      const result = await repository.findById('1');

      expect(prismaService.todo.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({
        ...mockTodo,
        metadata: mockTodo.metadata,
      });
    });

    it('should return null if todo not found', async () => {
      mockPrismaService.todo.findUnique.mockResolvedValue(null);

      const result = await repository.findById('999');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const updateData = { title: 'Updated Title', completed: true };
      const updatedTodo = { ...mockTodo, ...updateData };

      mockPrismaService.todo.update.mockResolvedValue(updatedTodo);

      const result = await repository.update('1', updateData);

      expect(prismaService.todo.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: updateData,
      });
      expect(result).toEqual({
        ...updatedTodo,
        metadata: updatedTodo.metadata,
      });
    });
  });

  describe('delete', () => {
    it('should delete a todo', async () => {
      mockPrismaService.todo.delete.mockResolvedValue(mockTodo);

      const result = await repository.delete('1');

      expect(prismaService.todo.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({
        ...mockTodo,
        metadata: mockTodo.metadata,
      });
    });
  });

  describe('deleteAll', () => {
    it('should delete all todos', async () => {
      mockPrismaService.todo.deleteMany.mockResolvedValue({ count: 5 });

      await repository.deleteAll();

      expect(prismaService.todo.deleteMany).toHaveBeenCalled();
    });
  });

  describe('findByCompleted', () => {
    it('should find todos by completion status', async () => {
      const completedTodos = [{ ...mockTodo, completed: true }];
      mockPrismaService.todo.findMany.mockResolvedValue(completedTodos);

      const result = await repository.findByCompleted(true);

      expect(prismaService.todo.findMany).toHaveBeenCalledWith({
        where: { completed: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(completedTodos.map(todo => ({
        ...todo,
        metadata: todo.metadata,
      })));
    });
  });

  describe('findByTags', () => {
    it('should find todos by tags', async () => {
      const tags = ['test', 'unit'];
      mockPrismaService.todo.findMany.mockResolvedValue([mockTodo]);

      const result = await repository.findByTags(tags);

      expect(prismaService.todo.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            hasSome: tags,
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([{
        ...mockTodo,
        metadata: mockTodo.metadata,
      }]);
    });

    it('should return empty array for empty tags', async () => {
      mockPrismaService.todo.findMany.mockResolvedValue([]);

      const result = await repository.findByTags([]);

      expect(prismaService.todo.findMany).toHaveBeenCalledWith({
        where: {
          tags: {
            hasSome: [],
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([]);
    });
  });
});