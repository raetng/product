# ── Stage 1: install & test ───────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

# Copy manifests first to leverage layer caching
COPY package*.json ./

# Install all deps (including devDependencies needed for tests)
RUN npm ci

# ── Stage 2: run tests ────────────────────────────────────────────────────────
FROM deps AS test

COPY src/ ./src/

RUN npm run test:ci

# ── Stage 3: production image ─────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production
WORKDIR /app

# Copy manifests and install production deps only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy application source (tests excluded)
COPY src/ ./src/

# Run as non-root user
USER node

EXPOSE 3001

CMD ["node", "src/index.js"]
