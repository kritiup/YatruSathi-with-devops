# syntax=docker/dockerfile:1

# ─────────────────────────────  Build stage  ─────────────────────────────
# Installs dependencies into an isolated virtualenv that the runtime stage
# copies wholesale (keeps pip/build tooling out of the final image).
FROM python:3.14-slim-bookworm AS builder

ENV PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

WORKDIR /app
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt


# ────────────────────────────  Runtime stage  ───────────────────────────
FROM python:3.14-slim-bookworm AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PATH="/opt/venv/bin:$PATH" \
    # Threading async_mode keeps rooms + session history in process memory,
    # so this service runs as a SINGLE gunicorn worker (see CMD).
    GUNICORN_THREADS=50

# Unprivileged runtime user
RUN groupadd --system app && useradd --system --gid app --home-dir /app app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY . .

RUN chown -R app:app /app
USER app

EXPOSE 5005

# Liveness: the service is up if /health answers 2xx/3xx. Inline Python keeps
# the slim image free of curl/wget (matches the backend image's approach).
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import sys,urllib.request as u; \
sys.exit(0 if u.urlopen('http://127.0.0.1:5005/health', timeout=4).status < 400 else 1)" \
    || exit 1

# Flask-SocketIO in threading mode: gthread worker, exactly one worker.
CMD ["sh", "-c", "exec gunicorn app:app \
    --bind 0.0.0.0:5005 \
    --worker-class gthread \
    --workers 1 \
    --threads ${GUNICORN_THREADS:-50} \
    --timeout ${GUNICORN_TIMEOUT:-120} \
    --access-logfile - \
    --error-logfile -"]
