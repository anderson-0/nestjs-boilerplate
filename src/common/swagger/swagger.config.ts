import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { FastifySwaggerOptions } from '@fastify/swagger';
import { FastifySwaggerUiOptions } from '@fastify/swagger-ui';

export const swaggerConfig = new DocumentBuilder()
  .setTitle('Todo Boilerplate API')
  .setDescription('API documentation for Todo Boilerplate application with multi-database support')
  .setVersion('1.0.0')
  .addTag('Todos', 'Todo management endpoints')
  .addTag('Authentication', 'Authentication endpoints')
  .addBearerAuth(
    {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'JWT Bearer Token',
      in: 'header',
    },
    'bearer-auth',
  )
  .addApiKey(
    {
      type: 'apiKey',
      name: 'x-api-key',
      in: 'header',
      description: 'API Key for authentication',
    },
    'api-key',
  )
  .addServer('http://localhost:3000', 'Development server')
  .build();

export const swaggerOptions: FastifySwaggerOptions = {
  openapi: {
    openapi: '3.0.0',
    info: {
      title: 'Todo Boilerplate API',
      description: 'API documentation for Todo Boilerplate application',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        'bearer-auth': {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Bearer Token',
        },
        'api-key': {
          type: 'apiKey',
          in: 'header',
          name: 'x-api-key',
          description: 'API Key for authentication',
        },
      },
    },
  },
} as any;

export const swaggerUiOptions: FastifySwaggerUiOptions = {
  routePrefix: '/api/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
  staticCSP: true,
};

export function setupSwagger(app: NestFastifyApplication) {
  const document = SwaggerModule.createDocument(app, swaggerConfig);

  app.register(require('@fastify/swagger'), swaggerOptions);
  app.register(require('@fastify/swagger-ui'), swaggerUiOptions);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
  });
}