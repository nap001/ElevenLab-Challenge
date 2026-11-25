# syntax=docker/dockerfile:1

# ── Stage 1: production dependencies only ───────────────────────────────────
FROM node:24.22.3-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# ── Stage 2: runtime image ──────────────────────────────────────────────────
FROM node:24.22.3-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=3001

WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json index.js app.js ./
COPY --chown=node:node src ./src

# index.js writes service-account.json (from GOOGLE_CREDENTIALS_JSON) into /app
# at boot, so the unprivileged user must own the directory.
RUN chown node:node /app

USER node

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3001) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]
