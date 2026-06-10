# Build stage
FROM oven/bun:1 AS builder

WORKDIR /app

# Install all dependencies (including dev) for build
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build with Node server preset (Nitro)
COPY . .
ENV NITRO_PRESET=node-server
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy built output
COPY --from=builder /app/.output ./.output

EXPOSE 3000

# Nitro node-server entry
CMD ["bun", "run", ".output/server/index.mjs"]
