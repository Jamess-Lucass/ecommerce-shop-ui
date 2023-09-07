FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY ./src/package.json ./src/pnpm-lock.yaml* ./
RUN yarn global add pnpm@8.6.0 && pnpm i --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY ./src .

RUN yarn global add pnpm@8.6.0

ENV NEXT_TELEMETRY_DISABLED 1

ARG NEXT_PUBLIC_ELASTIC_APM_SERVER_URL
ARG NEXT_PUBLIC_ELASTIC_APM_SERVICE_NAME
ARG NEXT_PUBLIC_ELASTIC_APM_DISTRIBUTED_TRACE_ORIGINS

ARG NEXT_PUBLIC_IDENTITY_SERVICE_BASE_URL
ARG NEXT_PUBLIC_LOGIN_UI_BASE_URL
ARG NEXT_PUBLIC_CATALOG_SERVICE_BASE_URL
ARG NEXT_PUBLIC_BASKET_SERVICE_BASE_URL
ARG NEXT_PUBLIC_ORDER_SERVICE_BASE_URL

RUN pnpm build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]