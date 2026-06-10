# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Install all dependencies (including dev) for build
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build with Nitro's Node server preset
COPY . .
ENV NITRO_PRESET=node-server
ENV SERVER_PRESET=node-server
RUN env -u LOVABLE_SANDBOX -u DEV_SERVER__PROJECT_PATH bun run build

# Production stage
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Copy built output
COPY --from=builder /app/.output ./.output

EXPOSE 3000

# Nitro Node server entry
CMD ["node", ".output/server/index.mjs"]
