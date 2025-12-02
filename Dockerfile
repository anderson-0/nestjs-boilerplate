# Multi-stage build for optimized production image
FROM oven/bun:1-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN bun run prisma:generate

# Build application
RUN bun run build

# Production stage
FROM oven/bun:1-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S bunjs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json ./
COPY bun.lockb* ./

# Install only production dependencies
RUN bun install --production --frozen-lockfile

# Copy built application and generated files
COPY --from=builder --chown=nestjs:bunjs /app/dist ./dist
COPY --from=builder --chown=nestjs:bunjs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:bunjs /app/src/common/repositories/prisma ./src/common/repositories/prisma

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["bun", "run", "start:prod"]