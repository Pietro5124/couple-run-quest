# syntax=docker/dockerfile:1.6

# ---------- Build stage ----------
FROM oven/bun:1 AS builder

WORKDIR /app

# Build-time public Supabase credentials (safe to bundle — they're publishable keys)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY
ARG VITE_SUPABASE_PROJECT_ID

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY
ENV VITE_SUPABASE_PROJECT_ID=$VITE_SUPABASE_PROJECT_ID

# Tell Nitro to produce a standalone Node server (.output/server/index.mjs)
ENV NITRO_PRESET=node-server
ENV SERVER_PRESET=node-server

# Install deps
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source and build (strip Lovable sandbox env vars so vite uses real build)
COPY . .
RUN env -u LOVABLE_SANDBOX -u DEV_SERVER__PROJECT_PATH bun run build

# ---------- Runtime stage ----------
FROM node:22-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000

# Only the Nitro output is needed at runtime — no node_modules, no source
COPY --from=builder /app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
