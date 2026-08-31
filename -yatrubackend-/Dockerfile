# syntax=docker/dockerfile:1

# ─────────────────────────────  Build stage  ─────────────────────────────
# Installs production dependencies into an isolated virtualenv that the
# runtime stage copies wholesale (keeps build tooling out of the final image).
FROM python:3.13-slim-bookworm AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .
COPY requirements/ requirements/
RUN pip install --upgrade pip && pip install -r requirements.txt


# ────────────────────────────  Runtime stage  ───────────────────────────
FROM python:3.13-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    DJANGO_SETTINGS_MODULE=backend.settings \
    PATH="/opt/venv/bin:$PATH"

# Unprivileged runtime user
RUN groupadd --system app && useradd --system --gid app --home-dir /app app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY . .

# Runtime-writable dirs. `data/` and `media/` are mount points for volumes in
# docker-compose; creating them here (owned by app) means a fresh named volume
# inherits writable ownership instead of coming up root-owned.
RUN chmod +x docker-entrypoint.sh scripts/*.sh \
    && mkdir -p data media logs staticfiles \
    && SECRET_KEY=build-only DEBUG=False python manage.py collectstatic --no-input \
    && chown -R app:app /app

USER app

EXPOSE 8000

# Shallow liveness check: the app is up if Django answers with any status < 500.
# The forwarded-proto header mirrors the production TLS proxy, so SECURE_SSL_REDIRECT
# (on when DEBUG=False) does not turn this into a redirect loop.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import sys,urllib.request as u; \
r=u.Request('http://127.0.0.1:8000/api/', headers={'X-Forwarded-Proto':'https'}); \
sys.exit(0 if u.urlopen(r, timeout=4).status < 500 else 1)" \
    || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
