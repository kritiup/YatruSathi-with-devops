# Deploying YatruSathi to AWS EKS

End-to-end: provision the infrastructure with Terraform, wire GitHub Actions to
it, and let the pipeline build → scan → push → roll out on every push to `main`.

```
GitHub push (main)
   └─ CI: frontend / backend / chatbot  →  security scan
        └─ push-ecr   (OIDC → ECR)      pushes  yatru-sathi-{frontend,backend,chatbot}:<sha>
             └─ deploy (OIDC → EKS)     kustomize edit set image + kubectl apply -k
```

Everything runs in **one region** (`ap-south-1` by default — matches the ECR
push in CI). Change it in `infra/terraform/terraform.tfvars` **and** the
`AWS_REGION` GitHub variable together.

---

## What Terraform creates (`infra/terraform/`)

| File | Resources |
| --- | --- |
| `network.tf` | VPC, 3 private + 3 public subnets, single NAT gateway |
| `eks.tf` | EKS cluster (1.31), one managed node group, core addons + EBS CSI + Container Insights, access entries |
| `namespaces.tf` | `yatrusathi` + `yatrusathi-staging` namespaces |
| `ecr.tf` | 3 ECR repos with scan-on-push + lifecycle policies (keep last 10, expire untagged) |
| `rds.tf` | PostgreSQL 16 (`db.t4g.micro`), SG open only to the node group |
| `secrets.tf` | Secrets Manager secrets `yatrusathi/app` + `yatrusathi/app-staging`, IRSA for External Secrets |
| `iam-github-oidc.tf` | GitHub OIDC provider + `yatrusathi-github-deploy` role (ECR push + `eks:DescribeCluster`) |
| `addons.tf` | Helm: AWS Load Balancer Controller, External Secrets Operator, metrics-server |

Cost note: an EKS control plane (~$73/mo) + 2× `t3.large` + NAT + RDS + ALB.
Run `terraform destroy` when you are not demoing.

---

## 1. Provision

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars     # edit: region, github_repository, your admin ARN
# optional remote state:
cp backend.tf.example backend.tf                 # edit the bucket, then re-init

terraform init
terraform apply
```

Save the outputs:

```bash
terraform output      # cluster_name, ecr_registry, github_deploy_role_arn, app_secret_arns ...
```

Terraform also created two Kubernetes namespaces (`yatrusathi`,
`yatrusathi-staging`) and, on the shared RDS instance, expects a separate
staging database — create it once:

```bash
# psql against the RDS endpoint as the master user
CREATE DATABASE "yatrusathi_staging";
```

### Fill in the real secrets

`secrets.tf` seeds `yatrusathi/app` **and** `yatrusathi/app-staging` with
`REPLACE_ME` placeholders for the third-party keys (Terraform ignores later
drift on these). For each secret, set the real values:

```bash
terraform output -json app_secret_arns    # {"production": "...", "staging": "..."}

ARN=<the production arn>
aws secretsmanager get-secret-value --secret-id "$ARN" --query SecretString --output text \
  | jq '.GROQ_API_KEY="gsk_..." | .RESEND_API_KEY="re_..." | .DJANGO_ADMIN_PASSWORD="..."' \
  | aws secretsmanager put-secret-value --secret-id "$ARN" --secret-string file:///dev/stdin
# repeat for the staging arn
```

External Secrets re-syncs within 1 minute; `DATABASE_URL`, `DJANGO_SECRET_KEY`
and `CHATBOT_SECRET_KEY` are already correct from `terraform apply`.

---

## 2. Connect GitHub Actions

Add three **repository variables** (Settings → Secrets and variables → Actions →
Variables — not secrets, these are not sensitive):

| Variable | Value |
| --- | --- |
| `AWS_DEPLOY_ROLE_ARN` | `terraform output -raw github_deploy_role_arn` |
| `AWS_REGION` | e.g. `ap-south-1` |
| `EKS_CLUSTER_NAME` | `terraform output -raw cluster_name` (default `yatrusathi`) |
| `STAGING_HOST` | the staging ALB DNS name (set after the first deploy — see §4) |
| `PRODUCTION_HOST` | the production ALB DNS name (set after the first deploy) |
| `VITE_SENTRY_DSN` | frontend Sentry DSN — optional, blank ⇒ disabled |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | optional, if the app uses Supabase |

`STAGING_HOST` / `PRODUCTION_HOST` are what get baked into the frontend bundle
(`VITE_API_BASE_URL=https://<host>/api/`, `VITE_CHATBOT_URL=https://<host>`).
Until they are set the deploy still runs but the frontend calls `localhost` —
so the first deploy is a two-pass affair: deploy once, read the ALB DNS name,
set the variable, push again.

The old `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are **no longer
used** — delete them. `github_repository` / `github_deploy_ref` in
`terraform.tfvars` must match this repo and the branch you deploy from, or the
role's trust policy will reject the OIDC token.

Optionally add required reviewers to the **`production`** GitHub Environment
(Settings → Environments) to gate production deploys behind a manual approval.

---

## 3. Deploy

Two environments, two overlays, one cluster:

| Environment | Namespace | Overlay | Trigger |
| --- | --- | --- | --- |
| staging | `yatrusathi-staging` | `k8s/overlays/staging` | **every push to `main`** (after CI + push-ecr pass) |
| production | `yatrusathi` | `k8s/overlays/production` | **manual** — run the workflow from the Actions tab (`workflow_dispatch`) |

Both go through `.github/scripts/deploy-eks.sh`: assume the OIDC role, rebuild
the frontend for that environment's host, `kustomize edit set image` to the
commit SHA, `kubectl apply -k`, then wait for the three rollouts.

### Manual (first run, to watch it)

```bash
aws eks update-kubeconfig --name "$(terraform -chdir=infra/terraform output -raw cluster_name)" --region ap-south-1

AWS_REGION=ap-south-1 EKS_CLUSTER_NAME=yatrusathi \
OVERLAY=k8s/overlays/staging NAMESPACE=yatrusathi-staging ENV_NAME=staging \
SHA=latest APP_HOST= \
bash .github/scripts/deploy-eks.sh
```

(`SHA=latest` uses the `:latest` images from push-ecr; leave `APP_HOST` empty
for the first pass, then set it once the ALB exists.)

---

## 4. Point clients at the load balancer

Get each environment's ALB DNS name (namespace `yatrusathi` for prod,
`yatrusathi-staging` for staging):

```bash
kubectl -n yatrusathi get ingress yatrusathi -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

That ALB DNS name routes:

| Path | Service |
| --- | --- |
| `/socket.io`, `/api/chat`, `/api/session` | chatbot |
| `/api`, `/admin`, `/static` | backend |
| `/` (everything else) | frontend |

The chatbot and backend share the host, so the frontend bundle is built with
`VITE_API_BASE_URL=https://<host>/api/` and `VITE_CHATBOT_URL=https://<host>`.
That is what `STAGING_HOST` / `PRODUCTION_HOST` feed into
`.github/scripts/deploy-eks.sh` — set them now and re-run the deploy so the
frontend stops calling `localhost`.

Then tighten Django's host allow-list (it ships as `*`):

```bash
kubectl -n yatrusathi patch configmap yatrusathi-config --type merge -p \
  '{"data":{"ALLOWED_HOSTS":"<alb-dns>","CORS_ALLOWED_ORIGINS":"https://<alb-dns>","CSRF_TRUSTED_ORIGINS":"https://<alb-dns>"}}'
kubectl -n yatrusathi rollout restart deployment/backend
```

(Or bake the value into the overlay's `kustomization.yaml` — both prod and
staging already have a ConfigMap patch stub.)

For a real domain: create an ACM cert, add `{"HTTPS":443}` to the Ingress
`listen-ports` annotation with `certificate-arn`, add an `ssl-redirect` action,
and point a Route 53 alias at the ALB.

---

## Observability

The `amazon-cloudwatch-observability` EKS addon (Container Insights) ships node,
pod and container metrics plus container logs to CloudWatch — see the
**CloudWatch → Container Insights** console. `metrics-server` (Helm, in
`addons.tf`) backs the HorizontalPodAutoscalers. Application errors go to
**Sentry** when a DSN is set: `SENTRY_DSN` in the ConfigMap for backend +
chatbot, `VITE_SENTRY_DSN` (repo variable) for the frontend — all inert when
blank.

## Known limitations / follow-ups

- **Chatbot runs as a single replica** (`replicas: 1`). Set `REDIS_URL` in the
  ConfigMap (e.g. an ElastiCache endpoint — not provisioned by Terraform) and
  raise `replicas` to scale out; the Socket.IO message queue is already wired.
- **Migrations run as an initContainer** on the backend pod — fine for a small
  app; concurrent rollouts could race. Promote to a pre-deploy `Job` / Helm hook
  for zero-downtime.
- **HTTP only** until a domain + ACM cert are added.
- **Staging shares the production RDS instance** (separate database name) and
  cluster. Give it its own instance for true isolation.
- **Single NAT gateway** and single-AZ RDS by default (`db_multi_az = false`) to
  keep the demo cheap — not HA.
- `scripts/seed_db.py` is **not** run automatically; apply it as a one-off
  `kubectl run` / Job if you want the sample catalogue.
