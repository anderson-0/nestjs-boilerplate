import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TodosService } from './todos.service';
import {
  type CreateTodoInput,
  type UpdateTodoInput,
} from '../common/entities/todo.entity';
import { CacheInterceptor } from '../common/cache/interceptors/cache.interceptor';
import { Cacheable, CacheInvalidate } from '../common/cache/decorators';
import { CacheTTL } from '../common/cache/cache.constants';
import { UseZodValidation } from '../common/validation';
import {
  CreateTodoSchema,
  UpdateTodoSchema,
} from '../common/validation/todo-schemas';
import { ApiAuth } from '../common/swagger/api-auth.decorator';
import { ApiError } from '../common/errors';

@Controller('todos')
@ApiTags('Todos')
@ApiAuth()
@UseInterceptors(CacheInterceptor)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new todo' })
  @ApiResponse({ status: 201, description: 'Todo created successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @UseZodValidation(CreateTodoSchema)
  @CacheInvalidate({
    pattern: 'TodosController:findAll:*',
    tags: ['todos'],
  })
  create(@Body() createTodoDto: CreateTodoInput) {
    return this.todosService.create(createTodoDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all todos' })
  @ApiResponse({ status: 200, description: 'Todos retrieved successfully' })
  @Cacheable({ ttl: CacheTTL.FIVE_MINUTES, keyPrefix: 'todos:all' })
  findAll() {
    return this.todosService.findAll();
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get todos by completion status' })
  @ApiQuery({
    name: 'status',
    required: false,
    description: 'Completion status (true/false)',
  })
  @ApiResponse({ status: 200, description: 'Todos retrieved successfully' })
  @Cacheable({ ttl: CacheTTL.ONE_MINUTE, keyPrefix: 'todos:completed' })
  findCompleted(@Query('status') status: string = 'true') {
    const completed = status === 'true';
    return this.todosService.findByCompleted(completed);
  }

  @Get('by-tags')
  @ApiOperation({ summary: 'Get todos by tags' })
  @ApiQuery({
    name: 'tags',
    required: true,
    description: 'Comma-separated list of tags',
  })
  @ApiResponse({ status: 200, description: 'Todos retrieved successfully' })
  @Cacheable({ ttl: CacheTTL.ONE_MINUTE, keyPrefix: 'todos:by-tags' })
  findByTags(@Query('tags') tags: string) {
    const tagArray = tags ? tags.split(',').map((tag) => tag.trim()) : [];
    return this.todosService.findByTags(tagArray);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a todo by ID' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 200, description: 'Todo retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @Cacheable({ ttl: CacheTTL.TEN_MINUTES, keyPrefix: 'todos:by-id' })
  async findOne(@Param('id') id: string) {
    const todo = await this.todosService.findById(id);
    if (!todo) {
      throw ApiError.todoNotFound(id);
    }
    return todo;
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a todo' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 200, description: 'Todo updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @UseZodValidation(UpdateTodoSchema)
  @CacheInvalidate({ pattern: 'todos:*', tags: ['todos'] })
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoInput,
  ) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a todo' })
  @ApiParam({ name: 'id', description: 'Todo ID' })
  @ApiResponse({ status: 200, description: 'Todo deleted successfully' })
  @ApiResponse({ status: 404, description: 'Todo not found' })
  @CacheInvalidate({ pattern: 'todos:*', tags: ['todos'] })
  async remove(@Param('id') id: string) {
    return this.todosService.delete(id);
  }
}
