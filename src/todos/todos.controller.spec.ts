import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { Todo, CreateTodoInput, UpdateTodoInput } from '../common/entities/todo.entity';
import { NotFoundException } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { ApiError } from '../common/errors';

describe('TodosController', () => {
  let controller: TodosController;
  let service: jest.Mocked<TodosService>;

  const mockTodo: Todo = {
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    tags: ['test'],
    createdAt: new Date('2025-10-11T21:21:58.243Z'),
    updatedAt: new Date('2025-10-11T21:21:58.243Z'),
  };

  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findByCompleted: jest.fn(),
    findByTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: mockService,
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
            reset: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            get: jest.fn(),
            getAll: jest.fn(),
            getAllAndOverride: jest.fn(),
            getAllAndMerge: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService) as jest.Mocked<TodosService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const createTodoDto: CreateTodoInput = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high',
        tags: ['new'],
      };

      mockService.create.mockResolvedValue(mockTodo);

      const result = await controller.create(createTodoDto);

      expect(service.create).toHaveBeenCalledWith(createTodoDto);
      expect(result).toEqual(mockTodo);
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const todos = [mockTodo];
      mockService.findAll.mockResolvedValue(todos);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });
  });

  describe('findCompleted', () => {
    it('should find completed todos', async () => {
      const completedTodos = [{ ...mockTodo, completed: true }];
      mockService.findByCompleted.mockResolvedValue(completedTodos);

      const result = await controller.findCompleted('true');

      expect(service.findByCompleted).toHaveBeenCalledWith(true);
      expect(result).toEqual(completedTodos);
    });

    it('should find incomplete todos', async () => {
      const incompleteTodos = [mockTodo];
      mockService.findByCompleted.mockResolvedValue(incompleteTodos);

      const result = await controller.findCompleted('false');

      expect(service.findByCompleted).toHaveBeenCalledWith(false);
      expect(result).toEqual(incompleteTodos);
    });

    it('should default to finding completed todos', async () => {
      const completedTodos = [{ ...mockTodo, completed: true }];
      mockService.findByCompleted.mockResolvedValue(completedTodos);

      const result = await controller.findCompleted();

      expect(service.findByCompleted).toHaveBeenCalledWith(true);
      expect(result).toEqual(completedTodos);
    });
  });

  describe('findByTags', () => {
    it('should find todos by tags', async () => {
      const tags = 'test,unit,controller';
      const expectedTags = ['test', 'unit', 'controller'];
      mockService.findByTags.mockResolvedValue([mockTodo]);

      const result = await controller.findByTags(tags);

      expect(service.findByTags).toHaveBeenCalledWith(expectedTags);
      expect(result).toEqual([mockTodo]);
    });

    it('should handle empty tags', async () => {
      mockService.findByTags.mockResolvedValue([]);

      const result = await controller.findByTags('');

      expect(service.findByTags).toHaveBeenCalledWith([]);
      expect(result).toEqual([]);
    });

    it('should trim whitespace from tags', async () => {
      const tags = ' test , unit , controller ';
      const expectedTags = ['test', 'unit', 'controller'];
      mockService.findByTags.mockResolvedValue([mockTodo]);

      const result = await controller.findByTags(tags);

      expect(service.findByTags).toHaveBeenCalledWith(expectedTags);
      expect(result).toEqual([mockTodo]);
    });
  });

  describe('findOne', () => {
    it('should return a todo by id', async () => {
      mockService.findById.mockResolvedValue(mockTodo);

      const result = await controller.findOne('1');

      expect(service.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTodo);
    });

    it('should throw ApiError when todo not found', async () => {
      mockService.findById.mockResolvedValue(null);

      await expect(controller.findOne('999')).rejects.toThrow(ApiError);
      expect(service.findById).toHaveBeenCalledWith('999');
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const updateTodoDto: UpdateTodoInput = {
        title: 'Updated Title',
        completed: true,
        priority: 'low',
      };
      const updatedTodo = { ...mockTodo, ...updateTodoDto };

      mockService.update.mockResolvedValue(updatedTodo);

      const result = await controller.update('1', updateTodoDto);

      expect(service.update).toHaveBeenCalledWith('1', updateTodoDto);
      expect(result).toEqual(updatedTodo);
    });
  });

  describe('remove', () => {
    it('should delete a todo', async () => {
      mockService.delete.mockResolvedValue(mockTodo);

      const result = await controller.remove('1');

      expect(service.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTodo);
    });
  });
});