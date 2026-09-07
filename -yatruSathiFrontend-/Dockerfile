FROM node:26-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


ARG VITE_API_BASE_URL
ARG VITE_CHATBOT_URL
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_SENTRY_DSN
ARG VITE_SENTRY_ENVIRONMENT
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL \
    VITE_CHATBOT_URL=$VITE_CHATBOT_URL \
    VITE_SUPABASE_URL=$VITE_SUPABASE_URL \
    VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY \
    VITE_SENTRY_DSN=$VITE_SENTRY_DSN \
    VITE_SENTRY_ENVIRONMENT=$VITE_SENTRY_ENVIRONMENT

COPY . .
RUN npm run build


# ───────────────────────────  Serve stage  ──────────────────────────────
FROM nginx:1.31-alpine AS serve

# SPA-aware config: history fallback, asset caching, gzip.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Ship only the static output.
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

# nginx:alpine already runs nginx in the foreground as its CMD.
