# API Documentation

This document provides comprehensive information about the REST API endpoints, request/response formats, and usage examples.

## 🌐 Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## 📖 Interactive Documentation

When `DOCUMENTATION_PROVIDER=swagger`, interactive API documentation is available at:
- **Development**: `http://localhost:3000/api/docs`
- **Production**: `https://your-domain.com/api/docs`

## 🔧 Authentication

The application supports multiple authentication methods based on the `AUTH_PROVIDER` configuration:

- `none`: No authentication required
- `basic`: Basic HTTP authentication
- `jwt`: JWT token-based authentication
- `oauth`: OAuth 2.0 integration
- `composite`: Multiple authentication methods

### JWT Authentication Example
```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "password"}'

# Use token in subsequent requests
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3000/api/todos
```

## 📝 Todos API

### Data Models

#### Todo Entity
```typescript
interface Todo {
  id: string;                    // Unique identifier
  title: string;                 // Todo title (required)
  description?: string;          // Optional description
  completed: boolean;            // Completion status (default: false)
  priority: 'low' | 'medium' | 'high';  // Priority level (default: 'medium')
  tags: string[];               // Array of tags (default: [])
  dueDate?: Date;               // Optional due date
  metadata?: Record<string, any>; // Optional metadata object
  createdAt: Date;              // Creation timestamp
  updatedAt: Date;              // Last update timestamp
}
```

#### Create Todo Input
```typescript
interface CreateTodoInput {
  title: string;                 // Required: 1-200 characters
  description?: string;          // Optional: max 1000 characters
  completed?: boolean;           // Optional: default false
  priority?: 'low' | 'medium' | 'high'; // Optional: default 'medium'
  tags?: string[];              // Optional: default []
  dueDate?: Date;               // Optional
  metadata?: Record<string, any>; // Optional
}
```

#### Update Todo Input
```typescript
interface UpdateTodoInput {
  title?: string;                // Optional: 1-200 characters
  description?: string;          // Optional: max 1000 characters
  completed?: boolean;           // Optional
  priority?: 'low' | 'medium' | 'high'; // Optional
  tags?: string[];              // Optional
  dueDate?: Date;               // Optional
  metadata?: Record<string, any>; // Optional
}
```

### Endpoints

#### 1. Get All Todos
```http
GET /api/todos
```

**Description**: Retrieve all todos, ordered by creation date (newest first).

**Response**:
```json
[
  {
    "id": "clp123abc",
    "title": "Learn NestJS",
    "description": "Complete the NestJS tutorial",
    "completed": false,
    "priority": "high",
    "tags": ["learning", "backend"],
    "dueDate": "2024-12-31T23:59:59.000Z",
    "metadata": {
      "estimatedHours": 8,
      "difficulty": "intermediate"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

**Example**:
```bash
curl -X GET http://localhost:3000/api/todos \
  -H "Accept: application/json"
```

#### 2. Create Todo
```http
POST /api/todos
```

**Description**: Create a new todo item.

**Request Body**:
```json
{
  "title": "Learn NestJS",
  "description": "Complete the NestJS tutorial",
  "priority": "high",
  "tags": ["learning", "backend"],
  "dueDate": "2024-12-31T23:59:59.000Z",
  "metadata": {
    "estimatedHours": 8,
    "difficulty": "intermediate"
  }
}
```

**Response** (201 Created):
```json
{
  "id": "clp123abc",
  "title": "Learn NestJS",
  "description": "Complete the NestJS tutorial",
  "completed": false,
  "priority": "high",
  "tags": ["learning", "backend"],
  "dueDate": "2024-12-31T23:59:59.000Z",
  "metadata": {
    "estimatedHours": 8,
    "difficulty": "intermediate"
  },
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Example**:
```bash
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Learn NestJS",
    "description": "Complete the NestJS tutorial",
    "priority": "high",
    "tags": ["learning", "backend"]
  }'
```

#### 3. Get Todo by ID
```http
GET /api/todos/{id}
```

**Description**: Retrieve a specific todo by its ID.

**Parameters**:
- `id` (path): Todo identifier

**Response** (200 OK):
```json
{
  "id": "clp123abc",
  "title": "Learn NestJS",
  "description": "Complete the NestJS tutorial",
  "completed": false,
  "priority": "high",
  "tags": ["learning", "backend"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

**Error Response** (404 Not Found):
```json
{
  "statusCode": 404,
  "message": "Todo with ID clp123abc not found",
  "error": "Not Found"
}
```

**Example**:
```bash
curl -X GET http://localhost:3000/api/todos/clp123abc \
  -H "Accept: application/json"
```

#### 4. Update Todo
```http
PATCH /api/todos/{id}
```

**Description**: Update an existing todo. Only provided fields will be updated.

**Parameters**:
- `id` (path): Todo identifier

**Request Body**:
```json
{
  "completed": true,
  "priority": "low",
  "tags": ["learning", "backend", "completed"]
}
```

**Response** (200 OK):
```json
{
  "id": "clp123abc",
  "title": "Learn NestJS",
  "description": "Complete the NestJS tutorial",
  "completed": true,
  "priority": "low",
  "tags": ["learning", "backend", "completed"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

**Example**:
```bash
curl -X PATCH http://localhost:3000/api/todos/clp123abc \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "priority": "low"
  }'
```

#### 5. Delete Todo
```http
DELETE /api/todos/{id}
```

**Description**: Delete a todo by its ID.

**Parameters**:
- `id` (path): Todo identifier

**Response** (200 OK):
```json
{
  "id": "clp123abc",
  "title": "Learn NestJS",
  "description": "Complete the NestJS tutorial",
  "completed": true,
  "priority": "low",
  "tags": ["learning", "backend", "completed"],
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3000/api/todos/clp123abc
```

#### 6. Get Todos by Completion Status
```http
GET /api/todos/completed?status={boolean}
```

**Description**: Filter todos by completion status.

**Query Parameters**:
- `status` (optional): `true` for completed, `false` for incomplete (default: `true`)

**Response** (200 OK):
```json
[
  {
    "id": "clp123abc",
    "title": "Learn NestJS",
    "completed": true,
    "priority": "low",
    "tags": ["learning", "backend", "completed"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
]
```

**Examples**:
```bash
# Get completed todos
curl -X GET "http://localhost:3000/api/todos/completed?status=true"

# Get incomplete todos
curl -X GET "http://localhost:3000/api/todos/completed?status=false"

# Default (completed todos)
curl -X GET http://localhost:3000/api/todos/completed
```

#### 7. Get Todos by Tags
```http
GET /api/todos/by-tags?tags={comma-separated-tags}
```

**Description**: Filter todos that contain any of the specified tags.

**Query Parameters**:
- `tags` (required): Comma-separated list of tags

**Response** (200 OK):
```json
[
  {
    "id": "clp123abc",
    "title": "Learn NestJS",
    "tags": ["learning", "backend"],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  {
    "id": "clp456def",
    "title": "Build API",
    "tags": ["backend", "api"],
    "createdAt": "2024-01-16T09:00:00.000Z",
    "updatedAt": "2024-01-16T09:00:00.000Z"
  }
]
```

**Examples**:
```bash
# Single tag
curl -X GET "http://localhost:3000/api/todos/by-tags?tags=backend"

# Multiple tags
curl -X GET "http://localhost:3000/api/todos/by-tags?tags=backend,learning,api"

# Tags with spaces (URL encoded)
curl -X GET "http://localhost:3000/api/todos/by-tags?tags=machine%20learning,ai"
```

## 🚀 Health Check

### Health Status
```http
GET /api/health
```

**Description**: Check application health status.

**Response** (200 OK):
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "provider": "prisma-postgresql"
    },
    "cache": {
      "status": "up",
      "provider": "redis"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "provider": "prisma-postgresql"
    },
    "cache": {
      "status": "up",
      "provider": "redis"
    }
  }
}
```

## 🔍 Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/todos"
}
```

### Validation Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "Title is required",
      "code": "invalid_type"
    },
    {
      "field": "priority",
      "message": "Invalid enum value. Expected 'low' | 'medium' | 'high'",
      "code": "invalid_enum_value"
    }
  ]
}
```

### HTTP Status Codes

| Code | Description | Usage |
|------|-------------|-------|
| 200 | OK | Successful GET, PATCH, DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (e.g., duplicate) |
| 422 | Unprocessable Entity | Business logic validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server errors |

## 🎯 Rate Limiting

The API implements rate limiting based on the application configuration:

- **Default Limit**: 1000 requests per minute per IP
- **Headers**: Rate limit information is included in response headers

### Rate Limit Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642248600
```

### Rate Limit Exceeded Response
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests",
  "error": "Too Many Requests"
}
```

## 📊 Caching

The API uses intelligent caching based on the `CACHE_PROVIDER` configuration:

### Cache Headers
```http
Cache-Control: public, max-age=300
ETag: "abc123def456"
Last-Modified: Mon, 15 Jan 2024 10:30:00 GMT
```

### Cache Configuration
- **GET /api/todos**: 5 minutes TTL
- **GET /api/todos/:id**: 10 minutes TTL
- **GET /api/todos/completed**: 1 minute TTL
- **GET /api/todos/by-tags**: 1 minute TTL

Cache is automatically invalidated on:
- POST /api/todos (creates new todo)
- PATCH /api/todos/:id (updates todo)
- DELETE /api/todos/:id (deletes todo)

## 🔧 Content Types

### Supported Content Types
- **Request**: `application/json`
- **Response**: `application/json`

### Request Headers
```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token> (if auth enabled)
```

## 📱 Example Usage

### JavaScript/TypeScript Client
```typescript
// Todo API client example
class TodoApiClient {
  private baseUrl = 'http://localhost:3000/api';

  async getTodos(): Promise<Todo[]> {
    const response = await fetch(`${this.baseUrl}/todos`);
    return response.json();
  }

  async createTodo(todo: CreateTodoInput): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/todos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(todo),
    });
    return response.json();
  }

  async updateTodo(id: string, updates: UpdateTodoInput): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/todos/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  }

  async deleteTodo(id: string): Promise<Todo> {
    const response = await fetch(`${this.baseUrl}/todos/${id}`, {
      method: 'DELETE',
    });
    return response.json();
  }
}
```

### Python Client
```python
import requests
from typing import List, Dict, Any, Optional

class TodoApiClient:
    def __init__(self, base_url: str = "http://localhost:3000/api"):
        self.base_url = base_url
        self.session = requests.Session()

    def get_todos(self) -> List[Dict[str, Any]]:
        response = self.session.get(f"{self.base_url}/todos")
        response.raise_for_status()
        return response.json()

    def create_todo(self, todo: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.post(
            f"{self.base_url}/todos",
            json=todo,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()

    def update_todo(self, todo_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        response = self.session.patch(
            f"{self.base_url}/todos/{todo_id}",
            json=updates,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        return response.json()

    def delete_todo(self, todo_id: str) -> Dict[str, Any]:
        response = self.session.delete(f"{self.base_url}/todos/{todo_id}")
        response.raise_for_status()
        return response.json()
```

### cURL Examples
```bash
# Create a todo
curl -X POST http://localhost:3000/api/todos \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Build awesome API",
    "description": "Create a comprehensive NestJS API",
    "priority": "high",
    "tags": ["development", "nestjs", "api"],
    "dueDate": "2024-12-31T23:59:59.000Z"
  }'

# Get all todos
curl -X GET http://localhost:3000/api/todos

# Update todo
curl -X PATCH http://localhost:3000/api/todos/clp123abc \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Delete todo
curl -X DELETE http://localhost:3000/api/todos/clp123abc

# Get completed todos
curl -X GET "http://localhost:3000/api/todos/completed?status=true"

# Get todos by tags
curl -X GET "http://localhost:3000/api/todos/by-tags?tags=development,api"
```

## 🔒 Security Considerations

### Input Validation
- All inputs are validated using Zod schemas
- SQL injection protection through ORM/ODM usage
- XSS protection through input sanitization

### Authentication & Authorization
- Configurable authentication methods
- JWT token validation (when enabled)
- Role-based access control (when implemented)

### Rate Limiting
- IP-based rate limiting
- Configurable limits per endpoint
- DDoS protection

### CORS Configuration
```typescript
// CORS settings
app.enableCors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

This comprehensive API documentation provides all the information needed to integrate with and use the NestJS Boilerplate API effectively.