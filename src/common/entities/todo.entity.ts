export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: string;
  dueDate?: Date;
  tags: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTodoInput {
  title: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: string;
  dueDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}