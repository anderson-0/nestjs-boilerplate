import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FeatureFlagsService } from './feature-flags.config';
import { DatabaseProvider, ErrorTrackingProvider, AuthProvider } from './feature-providers.enum';

describe('FeatureFlagsService', () => {
  let service: FeatureFlagsService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeatureFlagsService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config = {
                DATABASE_PROVIDER: DatabaseProvider.PRISMA_POSTGRESQL,
                ERROR_TRACKING_PROVIDER: ErrorTrackingProvider.NONE,
                AUTH_PROVIDER: AuthProvider.COMPOSITE,
                CACHE_PROVIDER: 'memory',
                DOCUMENTATION_PROVIDER: 'swagger',
                LOGGING_PROVIDER: 'basic',
                PERFORMANCE_PROVIDER: 'basic',
                DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
              };
              return config[key] || defaultValue;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<FeatureFlagsService>(FeatureFlagsService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return correct database provider', () => {
    expect(service.getDatabaseProvider()).toBe(DatabaseProvider.PRISMA_POSTGRESQL);
  });

  it('should return correct error tracking provider', () => {
    expect(service.getErrorTrackingProvider()).toBe(ErrorTrackingProvider.NONE);
  });

  it('should correctly identify if error tracking is enabled', () => {
    expect(service.isErrorTrackingEnabled()).toBe(false);
  });

  it('should correctly identify if auth is enabled', () => {
    expect(service.isAuthEnabled()).toBe(true);
  });

  it('should get provider description', () => {
    const description = service.getProviderDescription('prisma-postgresql');
    expect(description).toBe('Prisma ORM with PostgreSQL database');
  });
});