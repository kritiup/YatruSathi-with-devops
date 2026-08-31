# syntax=docker/dockerfile:1
# check=skip=SecretsUsedInArgOrEnv
# ^ The VITE_* values below are public browser config (the Supabase key is the
#   anon/publishable key, protected by row-level security). Vite inlines every
#   VITE_* var into the client bundle by design — these are not secrets.

# ───────────────────────────  Build stage  ──────────────────────────────
# Node 22 (current LTS) to match CI. Produces the static bundle in /app/dist
# via the project's own build command.
FROM node:22-alpine AS build

WORKDIR /app

# Install against the committed lockfile for a reproducible tree.
COPY package.json package-lock.json ./
RUN npm ci

# Public, build-time configuration. Vite inlines VITE_* at build time; any
# left unset fall back to the defaults already coded in the app, so the
# build works with or without these.
ARG VITE_API_BASE_URL
ARG VITE_CHATBOT_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CHATBOT_URL=$VITE_CHATBOT_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY . .
RUN npm run build


# ───────────────────────────  Serve stage  ──────────────────────────────
FROM nginx:1.27-alpine AS serve

# SPA-aware config: history fallback, asset caching, gzip.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the static output.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# nginx:alpine already runs nginx in the foreground as its CMD.
