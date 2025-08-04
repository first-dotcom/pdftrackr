FROM node:20-alpine AS base

# Install pnpm and security updates
RUN npm install -g pnpm && \
    apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S pdftrackr -u 1001

WORKDIR /app

# Copy package files
COPY backend/package*.json backend/pnpm-lock.yaml ./

# =============================================================================
# Dependencies stage
# =============================================================================
FROM base AS deps
RUN pnpm install --frozen-lockfile

# =============================================================================
# Development stage
# =============================================================================
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY backend/ .
RUN mkdir -p logs && chown pdftrackr:nodejs logs
USER pdftrackr
EXPOSE 3001
CMD ["pnpm", "run", "dev"]

# =============================================================================
# Builder stage  
# =============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ../tsconfig.base.json
COPY backend/ .
RUN pnpm run build && pnpm prune --production

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production
COPY --from=builder --chown=pdftrackr:nodejs /app/dist ./dist
COPY --from=builder --chown=pdftrackr:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pdftrackr:nodejs /app/package*.json ./
COPY --from=builder --chown=pdftrackr:nodejs /app/drizzle ./drizzle
RUN mkdir -p logs && chown pdftrackr:nodejs logs
USER pdftrackr
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]