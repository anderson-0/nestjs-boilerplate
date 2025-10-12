# Deployment Guide

This guide covers deploying the NestJS Boilerplate application to various environments including development, staging, and production.

## 🎯 Overview

The application supports multiple deployment strategies:
- **Docker**: Containerized deployment with Docker Compose
- **Cloud Platforms**: AWS, Google Cloud, Azure, Heroku
- **Traditional VPS**: Ubuntu/CentOS servers
- **Kubernetes**: Container orchestration
- **Serverless**: AWS Lambda, Vercel, Netlify Functions

## 🐳 Docker Deployment

### Development Environment

1. **Start Infrastructure Services**
   ```bash
   # Start PostgreSQL, MongoDB, and Redis
   docker-compose up -d

   # Check service status
   docker-compose ps
   ```

2. **Run Application**
   ```bash
   # Development mode with hot reload
   npm run start:dev

   # Or run in Docker
   docker-compose -f docker-compose.dev.yml up
   ```

### Production Docker Build

1. **Build Production Image**
   ```bash
   # Build the application image
   docker build -t nestjs-boilerplate:latest .

   # Multi-stage build for optimization
   docker build --target production -t nestjs-boilerplate:prod .
   ```

2. **Run Production Container**
   ```bash
   docker run -d \
     --name nestjs-app \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -e DATABASE_URL=postgresql://user:pass@host:5432/db \
     -e REDIS_URL=redis://redis:6379 \
     nestjs-boilerplate:latest
   ```

3. **Production Docker Compose**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   services:
     app:
       build:
         context: .
         target: production
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://postgres:password@postgres:5432/nestjs_prod
         - REDIS_URL=redis://redis:6379
       depends_on:
         - postgres
         - redis
       restart: unless-stopped

     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: nestjs_prod
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

     redis:
       image: redis:7-alpine
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

   ```bash
   # Deploy production stack
   docker-compose -f docker-compose.prod.yml up -d
   ```

## ☁️ Cloud Platform Deployment

### AWS Deployment

#### 1. AWS ECS (Elastic Container Service)

**Dockerfile Optimization**:
```dockerfile
# Multi-stage build for AWS ECS
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

**ECS Task Definition**:
```json
{
  "family": "nestjs-boilerplate",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "nestjs-app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/nestjs-boilerplate:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "DATABASE_PROVIDER",
          "value": "prisma-postgresql"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:database-url"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/nestjs-boilerplate",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

#### 2. AWS Lambda (Serverless)

**Install Serverless Framework**:
```bash
npm install -g serverless
npm install serverless-offline --save-dev
```

**serverless.yml**:
```yaml
service: nestjs-boilerplate

provider:
  name: aws
  runtime: nodejs18.x
  stage: ${opt:stage, 'dev'}
  region: us-east-1
  environment:
    NODE_ENV: ${self:provider.stage}
    DATABASE_URL: ${env:DATABASE_URL}
    REDIS_URL: ${env:REDIS_URL}

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          method: ANY
          path: /{proxy+}
          cors: true

plugins:
  - serverless-offline

custom:
  serverless-offline:
    httpPort: 3000
```

**Lambda Handler**:
```typescript
// src/lambda.ts
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import express from 'express';

let cachedServer: any;

export const handler = async (event: any, context: any) => {
  if (!cachedServer) {
    const expressApp = express();
    const nestApp = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp)
    );
    nestApp.setGlobalPrefix('api');
    await nestApp.init();
    cachedServer = serverlessExpress({ app: expressApp });
  }

  return cachedServer(event, context);
};
```

### Google Cloud Platform

#### 1. Google Cloud Run

**Build and Deploy**:
```bash
# Build and push to Google Container Registry
gcloud builds submit --tag gcr.io/PROJECT_ID/nestjs-boilerplate

# Deploy to Cloud Run
gcloud run deploy nestjs-boilerplate \
  --image gcr.io/PROJECT_ID/nestjs-boilerplate \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production \
  --set-env-vars DATABASE_PROVIDER=prisma-postgresql
```

**Cloud Run YAML**:
```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: nestjs-boilerplate
  annotations:
    run.googleapis.com/client-name: cloud-console
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 80
      containers:
      - image: gcr.io/PROJECT_ID/nestjs-boilerplate
        ports:
        - name: http1
          containerPort: 3000
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              key: DATABASE_URL
              name: database-secrets
        resources:
          limits:
            cpu: "1"
            memory: "512Mi"
```

### Azure Container Instances

```bash
# Create resource group
az group create --name nestjs-boilerplate --location eastus

# Create container instance
az container create \
  --resource-group nestjs-boilerplate \
  --name nestjs-app \
  --image your-registry/nestjs-boilerplate:latest \
  --cpu 1 \
  --memory 1 \
  --ports 3000 \
  --environment-variables NODE_ENV=production \
  --secure-environment-variables DATABASE_URL=$DATABASE_URL
```

### Heroku Deployment

1. **Heroku Configuration**
   ```bash
   # Install Heroku CLI and login
   npm install -g heroku
   heroku login

   # Create Heroku application
   heroku create nestjs-boilerplate-app

   # Add PostgreSQL addon
   heroku addons:create heroku-postgresql:hobby-dev

   # Add Redis addon
   heroku addons:create heroku-redis:hobby-dev

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set DATABASE_PROVIDER=prisma-postgresql
   ```

2. **Procfile**
   ```
   web: npm run start:prod
   release: npm run prisma:migrate
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

## 🖥️ Traditional VPS Deployment

### Ubuntu/CentOS Server Setup

1. **Server Prerequisites**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib

   # Install Redis
   sudo apt install redis-server

   # Install PM2 for process management
   npm install -g pm2
   ```

2. **Application Setup**
   ```bash
   # Clone and setup application
   git clone <repository-url> /var/www/nestjs-boilerplate
   cd /var/www/nestjs-boilerplate
   npm ci --production
   npm run build

   # Set up environment
   sudo cp .env.example .env.production
   sudo nano .env.production
   ```

3. **Database Setup**
   ```bash
   # Create database user and database
   sudo -u postgres psql
   CREATE USER nestjs WITH ENCRYPTED PASSWORD 'secure_password';
   CREATE DATABASE nestjs_prod OWNER nestjs;
   GRANT ALL PRIVILEGES ON DATABASE nestjs_prod TO nestjs;
   \q

   # Run migrations
   DATABASE_URL=postgresql://nestjs:secure_password@localhost:5432/nestjs_prod npm run prisma:migrate
   ```

4. **PM2 Configuration**
   ```javascript
   // ecosystem.config.js
   module.exports = {
     apps: [{
       name: 'nestjs-boilerplate',
       script: 'dist/main.js',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000,
         DATABASE_PROVIDER: 'prisma-postgresql',
         DATABASE_URL: 'postgresql://nestjs:secure_password@localhost:5432/nestjs_prod',
         REDIS_URL: 'redis://localhost:6379'
       },
       error_file: './logs/err.log',
       out_file: './logs/out.log',
       log_file: './logs/combined.log',
       time: true
     }]
   };
   ```

   ```bash
   # Start with PM2
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

5. **Nginx Reverse Proxy**
   ```nginx
   # /etc/nginx/sites-available/nestjs-boilerplate
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/nestjs-boilerplate /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## ⚓ Kubernetes Deployment

### Kubernetes Manifests

1. **Namespace**
   ```yaml
   # k8s/namespace.yaml
   apiVersion: v1
   kind: Namespace
   metadata:
     name: nestjs-boilerplate
   ```

2. **ConfigMap**
   ```yaml
   # k8s/configmap.yaml
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: nestjs-config
     namespace: nestjs-boilerplate
   data:
     NODE_ENV: "production"
     DATABASE_PROVIDER: "prisma-postgresql"
     CACHE_PROVIDER: "redis"
   ```

3. **Secret**
   ```yaml
   # k8s/secret.yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: nestjs-secrets
     namespace: nestjs-boilerplate
   type: Opaque
   data:
     DATABASE_URL: <base64-encoded-database-url>
     REDIS_URL: <base64-encoded-redis-url>
   ```

4. **Deployment**
   ```yaml
   # k8s/deployment.yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: nestjs-boilerplate
     namespace: nestjs-boilerplate
   spec:
     replicas: 3
     selector:
       matchLabels:
         app: nestjs-boilerplate
     template:
       metadata:
         labels:
           app: nestjs-boilerplate
       spec:
         containers:
         - name: nestjs-app
           image: your-registry/nestjs-boilerplate:latest
           ports:
           - containerPort: 3000
           envFrom:
           - configMapRef:
               name: nestjs-config
           - secretRef:
               name: nestjs-secrets
           resources:
             requests:
               memory: "256Mi"
               cpu: "250m"
             limits:
               memory: "512Mi"
               cpu: "500m"
           livenessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 30
             periodSeconds: 10
           readinessProbe:
             httpGet:
               path: /api/health
               port: 3000
             initialDelaySeconds: 5
             periodSeconds: 5
   ```

5. **Service**
   ```yaml
   # k8s/service.yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: nestjs-boilerplate-service
     namespace: nestjs-boilerplate
   spec:
     selector:
       app: nestjs-boilerplate
     ports:
     - protocol: TCP
       port: 80
       targetPort: 3000
     type: ClusterIP
   ```

6. **Ingress**
   ```yaml
   # k8s/ingress.yaml
   apiVersion: networking.k8s.io/v1
   kind: Ingress
   metadata:
     name: nestjs-boilerplate-ingress
     namespace: nestjs-boilerplate
     annotations:
       kubernetes.io/ingress.class: nginx
       cert-manager.io/cluster-issuer: letsencrypt-prod
   spec:
     tls:
     - hosts:
       - your-domain.com
       secretName: nestjs-tls
     rules:
     - host: your-domain.com
       http:
         paths:
         - path: /
           pathType: Prefix
           backend:
             service:
               name: nestjs-boilerplate-service
               port:
                 number: 80
   ```

### Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check deployment status
kubectl get pods -n nestjs-boilerplate
kubectl get services -n nestjs-boilerplate
kubectl get ingress -n nestjs-boilerplate

# View logs
kubectl logs -f deployment/nestjs-boilerplate -n nestjs-boilerplate
```

## 🔧 Environment Configuration

### Production Environment Variables

```bash
# Core Application
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DATABASE_PROVIDER=prisma-postgresql
DATABASE_URL=postgresql://user:password@host:5432/database
MONGODB_URL=mongodb://host:27017/database  # If using MongoDB

# Cache Configuration
CACHE_PROVIDER=redis
REDIS_URL=redis://host:6379

# Feature Flags
AUTH_PROVIDER=jwt
ERROR_TRACKING_PROVIDER=sentry
DOCUMENTATION_PROVIDER=swagger
LOGGING_PROVIDER=winston
PERFORMANCE_PROVIDER=datadog

# External Services
SENTRY_DSN=https://xxx@sentry.io/xxx
BUGSNAG_API_KEY=your-bugsnag-key
DATADOG_API_KEY=your-datadog-key

# Security
CORS_ORIGIN=https://your-frontend-domain.com
JWT_SECRET=your-secure-jwt-secret
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=1000
```

### Health Checks

The application provides health check endpoints for monitoring:

```bash
# Basic health check
curl http://localhost:3000/api/health

# Kubernetes health checks
livenessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /api/health
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## 📊 Monitoring and Logging

### Application Monitoring

1. **Sentry Error Tracking**
   ```bash
   ERROR_TRACKING_PROVIDER=sentry
   SENTRY_DSN=https://xxx@sentry.io/xxx
   ```

2. **DataDog Performance Monitoring**
   ```bash
   PERFORMANCE_PROVIDER=datadog
   DATADOG_API_KEY=your-api-key
   ```

3. **Custom Metrics**
   ```typescript
   // Add custom metrics endpoint
   @Get('metrics')
   getMetrics() {
     return {
       uptime: process.uptime(),
       memory: process.memoryUsage(),
       version: process.env.npm_package_version,
     };
   }
   ```

### Log Management

1. **Structured Logging**
   ```bash
   LOGGING_PROVIDER=winston
   LOG_LEVEL=info
   ```

2. **ELK Stack Integration**
   ```yaml
   # docker-compose.monitoring.yml
   version: '3.8'
   services:
     elasticsearch:
       image: docker.elastic.co/elasticsearch/elasticsearch:8.5.0
       environment:
         - discovery.type=single-node
         - xpack.security.enabled=false

     kibana:
       image: docker.elastic.co/kibana/kibana:8.5.0
       environment:
         - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
       ports:
         - "5601:5601"

     logstash:
       image: docker.elastic.co/logstash/logstash:8.5.0
       volumes:
         - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
   ```

## 🚀 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

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

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build Docker image
        run: |
          docker build -t ${{ secrets.DOCKER_REGISTRY }}/nestjs-boilerplate:${{ github.sha }} .
          docker tag ${{ secrets.DOCKER_REGISTRY }}/nestjs-boilerplate:${{ github.sha }} ${{ secrets.DOCKER_REGISTRY }}/nestjs-boilerplate:latest

      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker push ${{ secrets.DOCKER_REGISTRY }}/nestjs-boilerplate:${{ github.sha }}
          docker push ${{ secrets.DOCKER_REGISTRY }}/nestjs-boilerplate:latest

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          # Deploy to your preferred platform
          # kubectl, aws ecs, gcloud, etc.
```

## 📋 Production Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] SSL certificates configured
- [ ] Domain DNS configured
- [ ] Load balancer configured
- [ ] Backup strategy implemented
- [ ] Monitoring tools configured
- [ ] Error tracking enabled
- [ ] Performance monitoring setup
- [ ] Security scanning completed

### Post-deployment
- [ ] Health checks passing
- [ ] API endpoints responding
- [ ] Database connectivity verified
- [ ] Cache functionality working
- [ ] Logs being captured
- [ ] Metrics being collected
- [ ] Alerts configured
- [ ] Documentation updated
- [ ] Team notified

This comprehensive deployment guide covers all major deployment scenarios and provides the necessary configurations for successful production deployment.