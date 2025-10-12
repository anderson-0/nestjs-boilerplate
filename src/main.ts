import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import compression from '@fastify/compress';
import { setupSwagger } from './common/swagger/swagger.config';
import { FeatureFlagsService } from './common/config/feature-flags.config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  const configService = app.get(ConfigService);
  const featureFlags = app.get(FeatureFlagsService);

  // Log feature flags configuration
  featureFlags.logConfig();

  // Setup compression based on performance feature flag
  if (featureFlags.isCompressionEnabled()) {
    await app.register(compression as any, { encodings: ['gzip', 'deflate'] });
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors({
    origin: configService.get('CORS_ORIGIN', '*'),
    credentials: true,
  });

  app.setGlobalPrefix('api');

  // Setup Swagger documentation based on feature flag
  if (featureFlags.isDocumentationEnabled()) {
    setupSwagger(app);
  }

  const port = configService.get('PORT', 3000);
  const host = configService.get('HOST', '0.0.0.0');

  await app.listen(port, host);
  console.log(`🚀 Application is running on: ${await app.getUrl()}`);

  if (featureFlags.isDocumentationEnabled()) {
    console.log(`📚 Swagger documentation available at: ${await app.getUrl()}/api/docs`);
  }
}

bootstrap();