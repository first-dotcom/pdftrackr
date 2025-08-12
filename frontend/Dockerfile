FROM node:20-alpine AS base

# Install pnpm and security updates
RUN npm install -g pnpm && \
    apk upgrade --no-cache && \
    apk add --no-cache dumb-init curl && \
    rm -rf /var/cache/apk/*

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# Copy package files and base config
COPY frontend/package*.json frontend/pnpm-lock.yaml ./
COPY tsconfig.base.json ../tsconfig.base.json

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
COPY --from=base /tsconfig.base.json ../tsconfig.base.json
COPY shared/ ../shared/
COPY frontend/ .
RUN chown -R nextjs:nodejs /app

# Build the application for production mode
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm run build

USER nextjs
EXPOSE 3000
CMD ["pnpm", "run", "start"]

# =============================================================================
# Builder stage
# =============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY --from=base /tsconfig.base.json ../tsconfig.base.json
COPY shared/ ../shared/
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN pnpm run build

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["pnpm", "run", "start"]