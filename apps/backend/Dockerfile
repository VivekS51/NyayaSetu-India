# =========================================================================
# Multi-Stage Dockerfile for NyayaSetu India Backend (Node.js + Express + TS)
# =========================================================================

# 1. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy monorepo configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY packages/shared-types ./packages/shared-types
COPY apps/backend ./apps/backend

# Install dependencies & compile TypeScript
RUN pnpm --filter @legal-marketplace/backend install --frozen-lockfile=false
RUN pnpm --filter @legal-marketplace/backend run build

# 2. Production Stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 legaltech

# Copy compiled artifacts & production dependencies
COPY --from=builder --chown=legaltech:nodejs /app/apps/backend/dist ./dist
COPY --from=builder --chown=legaltech:nodejs /app/apps/backend/node_modules ./node_modules
COPY --from=builder --chown=legaltech:nodejs /app/apps/backend/package.json ./package.json

USER legaltech
EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "dist/server.js"]

