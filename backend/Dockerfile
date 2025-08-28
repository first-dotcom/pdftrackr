FROM node:20-alpine AS base

# Install pnpm, pm2 and security updates
RUN npm install -g pnpm pm2 && \
    apk update && \
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
COPY shared/ ../shared/
COPY backend/ .
RUN mkdir -p logs /tmp/temp_uploads /tmp/pdftrackr_uploads && \
    chown pdftrackr:nodejs logs /tmp/temp_uploads /tmp/pdftrackr_uploads && \
    chmod 755 /tmp/temp_uploads /tmp/pdftrackr_uploads
USER pdftrackr
EXPOSE 3001
CMD ["pnpm", "run", "dev"]

# =============================================================================
# Builder stage  
# =============================================================================
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig.base.json ../tsconfig.base.json
COPY shared/ ../shared/
COPY backend/ .
RUN pnpm run build && pnpm prune --prod --config.confirmModulesPurge=false

# =============================================================================
# Production stage
# =============================================================================
FROM base AS production
COPY --from=builder --chown=pdftrackr:nodejs /app/dist ./dist
COPY --from=builder --chown=pdftrackr:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=pdftrackr:nodejs /app/package*.json ./
COPY --from=builder --chown=pdftrackr:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=pdftrackr:nodejs /app/../shared ../shared
COPY --from=builder --chown=pdftrackr:nodejs /app/tsconfig.json ./tsconfig.json
COPY --from=builder --chown=pdftrackr:nodejs /app/ecosystem.config.js ./ecosystem.config.js
RUN mkdir -p logs /tmp/temp_uploads /tmp/pdftrackr_uploads && \
    chown pdftrackr:nodejs logs /tmp/temp_uploads /tmp/pdftrackr_uploads && \
    chmod 755 /tmp/temp_uploads /tmp/pdftrackr_uploads
USER pdftrackr
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1
ENTRYPOINT ["dumb-init", "--"]
CMD ["pm2-runtime", "start", "ecosystem.config.js"]