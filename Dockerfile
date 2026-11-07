# syntax=docker/dockerfile:1
# Production image for Azure App Service (Web App for Containers).
# Build:  docker build -t kit-de-atividades .
# Run:    docker run -p 8080:8080 --env-file <your env file> kit-de-atividades
# No secrets are baked in; configuration comes from the environment at run time.

ARG NODE_VERSION=24

# ---- dependencies -----------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS deps
WORKDIR /app
# CI skips the Playwright browser download in postinstall (the runtime stage installs it).
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
COPY scripts/postinstall-playwright.mjs scripts/postinstall-playwright.mjs
RUN npm ci

# ---- build ------------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS build
WORKDIR /app
ENV CI=1 NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runtime ----------------------------------------------------------------
FROM node:${NODE_VERSION}-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0 \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Chromium and its system libraries for PDF export, at the Playwright version the app uses.
COPY package.json ./package.json
RUN PW="$(node -p "(p=>(p.dependencies&&p.dependencies.playwright)||p.devDependencies.playwright)(require('./package.json')).replace(/^[^0-9]*/, '')")" \
 && npx --yes playwright@"$PW" install --with-deps chromium \
 && rm -rf /var/lib/apt/lists/* /root/.npm \
 && chmod -R a+rX /ms-playwright

COPY --from=build /app/.next/standalone ./
# The traced bundle misses files Playwright reads at run time (browsers.json), so ship the packages whole.
COPY --from=deps /app/node_modules/playwright ./node_modules/playwright
COPY --from=deps /app/node_modules/playwright-core ./node_modules/playwright-core
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public

# Run as the non-root user that ships with the Node image.
RUN chown -R node:node /app
USER node

EXPOSE 8080
CMD ["node", "server.js"]
