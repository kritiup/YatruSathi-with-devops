# Secret rotation

Two parts: **one-time cleanup** of credentials that were committed to the public
repo, and the **routine procedure** for rotating a secret going forward.

Rewriting git history does **not** un-leak anything already pushed — assume every
value below is compromised and must be regenerated at the provider.

---

## One-time: rotate the leaked credentials

From [`environment.md`](environment.md) — these appeared in committed code or
`.env` files:

| Credential | Where it was | Action |
| --- | --- | --- |
| OpenAI key `sk-proj-A8ETNo1qF3C…` | `chatbot/aichatbot.py` (deleted) | Revoke in the OpenAI dashboard. Not used by current code — do not re-add. |
| Google / Gemini API key `AIza…` | old chatbot `.env` | Delete the key in Google Cloud Console → Credentials. Not used by current code. |
| Supabase `service_role` key | frontend/back configs | Supabase → Project Settings → API → "Reset service_role secret". Update `SUPABASE_KEY` wherever the chatbot reads it. |
| Supabase `anon` key | frontend | Lower risk (RLS-enforced) but rotate alongside the above; update `VITE_SUPABASE_ANON_KEY`. |
| Postgres password `Minorproject@123` | old `.env` / migration scripts | Irrelevant on EKS (RDS password is Terraform-generated). If any old DB still exists, `ALTER USER … PASSWORD`. |
| Gmail app password (SMTP) | backend `.env` | Google Account → Security → App passwords → revoke. Generate a new one only if still using SMTP; prefer `RESEND_API_KEY`. |

After rotating, confirm nothing current still references an old value:

```bash
git grep -nE "sk-proj-|AIza[0-9A-Za-z_-]{20}|Minorproject@123|service_role" -- \
  ':!*.md' ':!**/node_modules/**'
```

CI now runs **gitleaks** on every push/PR, so a re-introduced credential fails
the build.

---

## Routine: rotating a secret

### Local / docker-compose

Values live in the untracked `.env` files. Edit the value, `docker compose up -d`
to recreate the affected service.

### EKS (production + staging)

App secrets are one JSON document per environment in AWS Secrets Manager
(`yatrusathi/app`, `yatrusathi/app-staging`), synced into the cluster by the
External Secrets Operator.

```bash
ARN=$(terraform -chdir=infra/terraform output -json app_secret_arns | jq -r '.production')

# read → patch one key → write a new version
aws secretsmanager get-secret-value --secret-id "$ARN" --query SecretString --output text \
  | jq '.GROQ_API_KEY="gsk_new_value"' \
  | aws secretsmanager put-secret-value --secret-id "$ARN" --secret-string file:///dev/stdin
```

External Secrets re-syncs within its `refreshInterval` (1 min). Restart the
consumers so they pick up the new env:

```bash
kubectl -n yatrusathi rollout restart deployment/backend deployment/chatbot
```

`DATABASE_URL` and the Django/Flask signing keys are managed by Terraform
(`secrets.tf`); to rotate the signing keys, taint the `random_password`
resources and `terraform apply`, then restart the deployments.

### Database password

```bash
terraform -chdir=infra/terraform taint random_password.db
terraform -chdir=infra/terraform apply   # updates the RDS master password AND both DATABASE_URLs
kubectl -n yatrusathi rollout restart deployment/backend
kubectl -n yatrusathi-staging rollout restart deployment/backend
```

### GitHub OIDC / AWS

There is no long-lived AWS key to rotate — CI federates via OIDC. To revoke CI's
access entirely, remove the `AWS_DEPLOY_ROLE_ARN` variable or delete the
`yatrusathi-github-deploy` role.

### Frontend Sentry / Supabase

These are build-time (`VITE_*`) — update the repo variable and re-run a deploy
so the frontend image is rebuilt.
