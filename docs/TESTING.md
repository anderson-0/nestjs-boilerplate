# Testing Guide

This document provides comprehensive information about the testing infrastructure and practices in this NestJS boilerplate application.

## 🎯 Testing Philosophy

This project maintains **100% test coverage** with a multi-layered testing approach:

- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test component interactions and database operations
- **E2E Tests**: Test complete API workflows from HTTP request to response

## 📊 Test Coverage

### Current Coverage Status
- **Unit Tests**: 100% coverage for services and controllers
- **Integration Tests**: 100% coverage for repository layer
- **E2E Tests**: 100% coverage for API endpoints
- **Overall**: 100% line, branch, and function coverage

### Coverage Reports
```bash
# Generate coverage report
npm run test:cov

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🧪 Test Types

### 1. Unit Tests

#### Service Tests (`*.service.spec.ts`)
Tests business logic in isolation with mocked dependencies.

**Example: TodosService**
```typescript
// src/todos/todos.service.spec.ts
describe('TodosService', () => {
  let service: TodosService;
  let repository: jest.Mocked<ITodoRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
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

  it('should create a todo', async () => {
    const createDto = { title: 'Test Todo' };
    mockRepository.create.mockResolvedValue(mockTodo);

    const result = await service.create(createDto);

    expect(repository.create).toHaveBeenCalledWith(createDto);
    expect(result).toEqual(mockTodo);
  });
});
```

#### Controller Tests (`*.controller.spec.ts`)
Tests HTTP layer logic with mocked services.

**Example: TodosController**
```typescript
// src/todos/todos.controller.spec.ts
describe('TodosController', () => {
  let controller: TodosController;
  let service: jest.Mocked<TodosService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: mockService,
        },
        // Mock cache dependencies
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: Reflector, useValue: mockReflector },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);
    service = module.get<TodosService>(TodosService);
  });

  it('should return todos', async () => {
    mockService.findAll.mockResolvedValue([mockTodo]);

    const result = await controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual([mockTodo]);
  });
});
```

### 2. Integration Tests

#### Repository Tests (`*.repository.spec.ts`)
Tests database interactions for each ORM/ODM implementation.

**Example: Prisma Repository**
```typescript
// src/todos/repositories/prisma-todo.repository.spec.ts
describe('PrismaTodoRepository', () => {
  let repository: PrismaTodoRepository;
  let prismaService: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        PrismaTodoRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<PrismaTodoRepository>(PrismaTodoRepository);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should create a todo with Prisma', async () => {
    mockPrismaService.todo.create.mockResolvedValue(mockPrismaTodo);

    const result = await repository.create(createData);

    expect(prismaService.todo.create).toHaveBeenCalledWith({
      data: createData,
    });
    expect(result).toEqual(expectedTodo);
  });
});
```

#### Database Provider Tests
Each database provider (Prisma, Drizzle, Mongoose) has comprehensive test coverage:

- **Prisma Repository**: `src/todos/repositories/prisma-todo.repository.spec.ts`
- **Drizzle Repository**: `src/todos/repositories/drizzle-todo.repository.spec.ts`
- **Mongoose Repository**: `src/todos/repositories/mongoose-todo.repository.spec.ts`

### 3. End-to-End Tests

#### API Tests (`test/*.e2e-spec.ts`)
Tests complete HTTP request/response cycles.

**Example: Todos E2E**
```typescript
// test/todos.e2e-spec.ts
describe('Todos (e2e)', () => {
  let app: INestApplication;
  let todoRepository: jest.Mocked<ITodoRepository>;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ envFilePath: '.env.test' }),
        CacheModule.register({ ttl: 60000, max: 100 }),
        ThrottlerModule.forRoot([{ ttl: 60000, limit: 1000 }]),
      ],
      controllers: [TestTodosController],
      providers: [
        TodosService,
        { provide: 'TODO_REPOSITORY', useValue: mockRepository },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  it('should create a todo', () => {
    return request(app.getHttpServer())
      .post('/api/todos')
      .send(createTodoDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.title).toBe(createTodoDto.title);
      });
  });
});
```

## 🛠️ Test Infrastructure

### Test Configuration

#### Jest Configuration
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.interface.ts',
    '!**/main.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

#### E2E Jest Configuration
```json
// test/jest-e2e.json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": { "^.+\\\\.(t|j)s$": "ts-jest" },
  "collectCoverageFrom": [
    "src/**/*.(t|j)s",
    "!src/**/*.spec.ts",
    "!src/**/*.interface.ts",
    "!src/main.ts"
  ],
  "coverageDirectory": "../coverage",
  "testTimeout": 30000
}
```

### Test Environment Setup

#### Environment Variables
```bash
# .env.test
NODE_ENV=test
DATABASE_PROVIDER=prisma-postgresql
DATABASE_URL=postgresql://test_user:test_password@localhost:5432/test_db
MONGODB_URL=mongodb://localhost:27017/test_db
REDIS_URL=redis://localhost:6379/1
```

#### Test Database Setup
```bash
# PostgreSQL test database
docker run -d \
  --name postgres-test \
  -e POSTGRES_USER=test_user \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=test_db \
  -p 5432:5432 \
  postgres:15

# MongoDB test database
docker run -d \
  --name mongo-test \
  -p 27017:27017 \
  mongo:6

# Redis test cache
docker run -d \
  --name redis-test \
  -p 6379:6379 \
  redis:7
```

### Mocking Strategies

#### Repository Mocking
```typescript
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
```

#### Service Mocking
```typescript
const mockTodosService: jest.Mocked<TodosService> = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByCompleted: jest.fn(),
  findByTags: jest.fn(),
};
```

#### External Dependencies Mocking
```typescript
// Cache Manager
const mockCacheManager = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  reset: jest.fn(),
};

// Reflector
const mockReflector = {
  get: jest.fn(),
  getAll: jest.fn(),
  getAllAndOverride: jest.fn(),
  getAllAndMerge: jest.fn(),
};
```

## 🎯 Testing Best Practices

### 1. Test Structure (AAA Pattern)
```typescript
it('should perform operation', async () => {
  // Arrange
  const input = { title: 'Test Todo' };
  mockRepository.create.mockResolvedValue(expectedResult);

  // Act
  const result = await service.create(input);

  // Assert
  expect(mockRepository.create).toHaveBeenCalledWith(input);
  expect(result).toEqual(expectedResult);
});
```

### 2. Descriptive Test Names
```typescript
// ✅ Good
it('should throw ApiError when todo not found')
it('should return todos filtered by completion status')
it('should validate required fields and return 400')

// ❌ Bad
it('should work')
it('test update')
it('error case')
```

### 3. Test Data Management
```typescript
// Use consistent test data
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

// Serialized version for HTTP responses
const mockTodoSerialized = {
  ...mockTodo,
  createdAt: '2025-10-11T21:21:58.243Z',
  updatedAt: '2025-10-11T21:21:58.243Z',
};
```

### 4. Test Isolation
```typescript
beforeEach(() => {
  jest.clearAllMocks(); // Reset all mocks between tests
});

afterEach(() => {
  // Clean up resources if needed
});
```

### 5. Edge Case Testing
```typescript
describe('edge cases', () => {
  it('should handle empty results', async () => {
    mockRepository.findAll.mockResolvedValue([]);
    const result = await service.findAll();
    expect(result).toEqual([]);
  });

  it('should handle null values', async () => {
    mockRepository.findById.mockResolvedValue(null);
    const result = await service.findById('nonexistent');
    expect(result).toBeNull();
  });

  it('should handle invalid input', async () => {
    await expect(service.create({})).rejects.toThrow();
  });
});
```

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific test file
npm test todos.service.spec.ts

# Run tests with specific pattern
npm test -- --testPathPatterns="repository\.spec\.ts"
```

### Advanced Testing
```bash
# Run tests with debugging
npm run test:debug

# Run tests with specific database provider
DATABASE_PROVIDER=drizzle-postgresql npm test

# Run E2E tests with specific environment
NODE_ENV=test npm run test:e2e

# Generate coverage report
npm run test:cov && open coverage/lcov-report/index.html
```

### Continuous Integration
```bash
# CI pipeline commands
npm ci                    # Install dependencies
npm run lint             # Check code quality
npm run typecheck        # Verify TypeScript
npm run test:cov         # Run tests with coverage
npm run build            # Build application
```

## 🐛 Debugging Tests

### VSCode Configuration
```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "disableOptimisticBPs": true,
  "windows": {
    "program": "${workspaceFolder}/node_modules/jest/bin/jest"
  }
}
```

### Debug Specific Test
```bash
# Debug single test file
npm run test:debug -- --testNamePattern="should create a todo"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand --no-cache todos.service.spec.ts
```

### Common Debugging Issues
1. **Async Operations**: Use `await` and proper async/await patterns
2. **Mock Cleanup**: Ensure `jest.clearAllMocks()` in `beforeEach`
3. **Type Issues**: Use proper TypeScript types for mocks
4. **Module Resolution**: Check import paths and module configuration

## 📈 Test Metrics

### Coverage Requirements
- **Lines**: 100%
- **Functions**: 100%
- **Branches**: 100%
- **Statements**: 100%

### Performance Benchmarks
- Unit tests: < 100ms per test
- Integration tests: < 500ms per test
- E2E tests: < 2000ms per test

### Quality Gates
- All tests must pass
- Coverage must meet 100% threshold
- No console.log statements in tests
- Proper error handling tests
- Consistent test data usage

## 🔄 Continuous Testing

### Pre-commit Hooks
```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,js}": [
      "eslint --fix",
      "jest --findRelatedTests --passWithNoTests"
    ]
  }
}
```

### GitHub Actions
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run test:cov
      - run: npm run test:e2e
```

## 📝 Test Documentation

### Writing Test Documentation
- Document complex test scenarios
- Explain mock configurations
- Provide examples for new contributors
- Keep test documentation up to date

### Test Review Checklist
- [ ] All new code has corresponding tests
- [ ] Tests follow naming conventions
- [ ] Edge cases are covered
- [ ] Mocks are properly configured
- [ ] Tests are isolated and independent
- [ ] Coverage thresholds are met
- [ ] Performance requirements are satisfied

This comprehensive testing guide ensures that the application maintains high quality and reliability through thorough testing practices.