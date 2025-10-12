import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TodosService } from '../src/todos/todos.service';
import type {
  CreateTodoInput,
  UpdateTodoInput,
} from '../src/common/entities/todo.entity';
import { ApiError } from '../src/common/errors';

@Controller('todos')
export class TestTodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoInput) {
    // Simple validation for test
    if (!createTodoDto.title) {
      throw new BadRequestException('Validation failed');
    }
    return this.todosService.create(createTodoDto);
  }

  @Get()
  findAll() {
    return this.todosService.findAll();
  }

  @Get('completed')
  findCompleted(@Query('status') status: string = 'true') {
    const completed = status === 'true';
    return this.todosService.findByCompleted(completed);
  }

  @Get('by-tags')
  findByTags(@Query('tags') tags: string) {
    const tagArray = tags ? tags.split(',').map((tag) => tag.trim()) : [];
    return this.todosService.findByTags(tagArray);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const todo = await this.todosService.findById(id);
    if (!todo) {
      throw ApiError.todoNotFound(id);
    }
    return todo;
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTodoDto: UpdateTodoInput,
  ) {
    return this.todosService.update(id, updateTodoDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.todosService.delete(id);
  }
}
