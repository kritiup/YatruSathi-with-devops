#!/usr/bin/env bash
# Roll the freshly-pushed images out to one EKS overlay.
#
# Driven entirely by env vars set in the workflow job:
#   AWS_REGION, EKS_CLUSTER_NAME, OVERLAY, NAMESPACE, ENV_NAME, SHA
# Optional (frontend is host-specific — Vite bakes URLs in at build time):
#   APP_HOST, VITE_SENTRY_DSN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
set -euo pipefail

: "${AWS_REGION:?}" "${EKS_CLUSTER_NAME:?}" "${OVERLAY:?}" "${NAMESPACE:?}" "${ENV_NAME:?}" "${SHA:?}"

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws eks update-kubeconfig --name "$EKS_CLUSTER_NAME" --region "$AWS_REGION"

# ── Frontend: rebuild per environment with that environment's public URLs ──
# backend + chatbot images are host-agnostic and already pushed by push-ecr.
frontend_tag="$SHA"
if [[ -n "${APP_HOST:-}" ]]; then
  frontend_tag="${SHA}-${ENV_NAME}"
  aws ecr get-login-password --region "$AWS_REGION" \
    | docker login --username AWS --password-stdin "$REGISTRY"
  docker build ./-yatruSathiFrontend- \
    --build-arg "VITE_API_BASE_URL=https://${APP_HOST}/api/" \
    --build-arg "VITE_CHATBOT_URL=https://${APP_HOST}" \
    --build-arg "VITE_SENTRY_DSN=${VITE_SENTRY_DSN:-}" \
    --build-arg "VITE_SENTRY_ENVIRONMENT=${ENV_NAME}" \
    --build-arg "VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-}" \
    --build-arg "VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:-}" \
    -t "${REGISTRY}/yatru-sathi-frontend:${frontend_tag}"
  docker push "${REGISTRY}/yatru-sathi-frontend:${frontend_tag}"
else
  echo "::warning::APP_HOST not set for ${ENV_NAME} — frontend will call localhost. Set the ${ENV_NAME} host as a repo variable."
fi

pushd "$OVERLAY" >/dev/null
kustomize edit set image \
  "backend=${REGISTRY}/yatru-sathi-backend:${SHA}" \
  "frontend=${REGISTRY}/yatru-sathi-frontend:${frontend_tag}" \
  "chatbot=${REGISTRY}/yatru-sathi-chatbot:${SHA}"
popd >/dev/null

kubectl apply -k "$OVERLAY"

for d in backend frontend chatbot; do
  kubectl -n "$NAMESPACE" rollout status "deployment/${d}" --timeout=180s
done
