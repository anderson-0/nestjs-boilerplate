/* eslint-disable @typescript-eslint/no-require-imports */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request = require('supertest');
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';

import { TodosService } from '../src/todos/todos.service';
import { TodosController } from '../src/todos/todos.controller';
import { ITodoRepository } from '../src/todos/repositories/todo.repository.interface';
import { Todo } from '../src/common/entities/todo.entity';
import { ZodValidationPipe } from '../src/common/validation/zod-validation.pipe';

describe('Todos (e2e)', () => {
  let app: INestApplication;
  let todoRepository: jest.Mocked<ITodoRepository>;

  // Serialized todo as it appears in HTTP responses (dates as strings)
  const mockTodoSerialized = {
    id: '1',
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    priority: 'medium',
    tags: ['test'],
    createdAt: '2025-10-11T21:21:58.243Z',
    updatedAt: '2025-10-11T21:21:58.243Z',
  };

  // Todo object for mock repository (dates as Date objects)
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

  beforeAll(async () => {
    const mockRepository: jest.Mocked<ITodoRepository> = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn(),
      findByCompleted: jest.fn(),
      findByTags: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        CacheModule.register({
          isGlobal: true,
          ttl: 60000,
          max: 100,
        }),
        ThrottlerModule.forRoot([
          {
            ttl: 60000,
            limit: 1000,
          },
        ]),
      ],
      controllers: [TodosController],
      providers: [
        TodosService,
        {
          provide: 'TODO_REPOSITORY',
          useValue: mockRepository,
        },
      ],
    })
    .overrideGuard({} as any) // Override auth guards for testing
    .useValue({ canActivate: () => true })
    .compile();

    app = moduleFixture.createNestApplication();
    // Configure Express to parse JSON properly
    app.use(require('express').json());
    app.enableCors();
    todoRepository = moduleFixture.get('TODO_REPOSITORY');

    // Set global prefix like in main.ts
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('/api/todos (GET)', () => {
    it('should return an array of todos', () => {
      todoRepository.findAll.mockResolvedValue([mockTodo]);

      return request(app.getHttpServer())
        .get('/api/todos')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toEqual([mockTodoSerialized]);
        });
    });
  });

  describe('/api/todos (POST)', () => {
    it('should create a new todo', () => {
      const createTodoDto = {
        title: 'Test Todo E2E',
        description: 'Test Description E2E',
        completed: false,
        priority: 'medium',
        tags: ['test', 'e2e'],
      };

      const createdTodo = { ...mockTodo, ...createTodoDto, id: '2' };
      todoRepository.create.mockResolvedValue(createdTodo);

      return request(app.getHttpServer())
        .post('/api/todos')
        .send(createTodoDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.title).toBe(createTodoDto.title);
          expect(res.body.description).toBe(createTodoDto.description);
          expect(res.body.completed).toBe(false);
          expect(res.body.priority).toBe('medium');
          expect(Array.isArray(res.body.tags)).toBe(true);
        });
    });

    it('should validate required fields', () => {
      const invalidDto = {
        description: 'Missing title',
      };

      return request(app.getHttpServer())
        .post('/api/todos')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/api/todos/:id (GET)', () => {
    it('should return a specific todo', () => {
      todoRepository.findById.mockResolvedValue(mockTodo);

      return request(app.getHttpServer())
        .get('/api/todos/1')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual(mockTodoSerialized);
        });
    });

    it('should return 404 for non-existent todo', () => {
      todoRepository.findById.mockResolvedValue(null);

      return request(app.getHttpServer())
        .get('/api/todos/non-existent-id')
        .expect(404);
    });
  });

  describe('/api/todos/:id (PATCH)', () => {
    it('should update a todo', () => {
      const updateDto = {
        title: 'Updated Todo Title',
        completed: true,
        priority: 'low' as const,
      };

      const updatedTodo = { ...mockTodo, ...updateDto };
      todoRepository.update.mockResolvedValue(updatedTodo);

      return request(app.getHttpServer())
        .patch('/api/todos/1')
        .set('Content-Type', 'application/json')
        .send(updateDto)
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe(updateDto.title);
          expect(res.body.completed).toBe(true);
          expect(res.body.priority).toBe('low');
        });
    });
  });

  describe('/api/todos/:id (DELETE)', () => {
    it('should delete a todo', () => {
      todoRepository.delete.mockResolvedValue(mockTodo);

      return request(app.getHttpServer()).delete('/api/todos/1').expect(200);
    });
  });
});
