/* eslint-disable @typescript-eslint/unbound-method */
import { Test, TestingModule } from '@nestjs/testing';
import { TodosService } from './todos.service';
import { ITodoRepository } from './repositories/todo.repository.interface';
import { Todo } from '../common/entities/todo.entity';

describe('TodosService', () => {
  let service: TodosService;
  let repository: ITodoRepository;

  const mockTodo: Todo = {
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    tags: ['test'],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteAll: jest.fn(),
    findByCompleted: jest.fn(),
    findByTags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: 'TODO_REPOSITORY',
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);
    repository = module.get<ITodoRepository>('TODO_REPOSITORY');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a todo', async () => {
      const createTodoDto = {
        title: 'New Todo',
        description: 'New Description',
        priority: 'high' as const,
        tags: ['new'],
      };

      mockRepository.create.mockResolvedValue(mockTodo);

      const result = await service.create(createTodoDto);

      expect(repository.create).toHaveBeenCalledWith(createTodoDto);
      expect(result).toEqual(mockTodo);
    });
  });

  describe('findAll', () => {
    it('should return all todos', async () => {
      const todos = [mockTodo];
      mockRepository.findAll.mockResolvedValue(todos);

      const result = await service.findAll();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(todos);
    });
  });

  describe('findById', () => {
    it('should return a todo by id', async () => {
      mockRepository.findById.mockResolvedValue(mockTodo);

      const result = await service.findById('1');

      expect(repository.findById).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTodo);
    });

    it('should return null if todo not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.findById('999');

      expect(repository.findById).toHaveBeenCalledWith('999');
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a todo', async () => {
      const updateDto = { title: 'Updated Title', completed: true };
      const updatedTodo = { ...mockTodo, ...updateDto };

      mockRepository.update.mockResolvedValue(updatedTodo);

      const result = await service.update('1', updateDto);

      expect(repository.update).toHaveBeenCalledWith('1', updateDto);
      expect(result).toEqual(updatedTodo);
    });
  });

  describe('delete', () => {
    it('should delete a todo', async () => {
      mockRepository.delete.mockResolvedValue(mockTodo);

      const result = await service.delete('1');

      expect(repository.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockTodo);
    });
  });

  describe('findByCompleted', () => {
    it('should find todos by completion status', async () => {
      const completedTodos = [{ ...mockTodo, completed: true }];
      mockRepository.findByCompleted.mockResolvedValue(completedTodos);

      const result = await service.findByCompleted(true);

      expect(repository.findByCompleted).toHaveBeenCalledWith(true);
      expect(result).toEqual(completedTodos);
    });
  });

  describe('findByTags', () => {
    it('should find todos by tags', async () => {
      const tags = ['test', 'unit'];
      mockRepository.findByTags.mockResolvedValue([mockTodo]);

      const result = await service.findByTags(tags);

      expect(repository.findByTags).toHaveBeenCalledWith(tags);
      expect(result).toEqual([mockTodo]);
    });
  });
});
