# Build stage
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy dependency files
COPY package.json bun.lock bunfig.toml ./
COPY tsconfig.json vite.config.ts ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build the app
RUN bun run build

# Production stage
FROM oven/bun:slim AS runner

WORKDIR /app

# Copy built output and necessary files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Expose the port (Nitro default is 3000)
ENV PORT=3000
ENV NITRO_PRESET=node-server
EXPOSE 3000

# Start the server
CMD ["bun", "run", "dist/server/index.mjs"]
