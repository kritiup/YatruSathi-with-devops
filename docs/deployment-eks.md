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
| `eks.tf` | EKS cluster (1.31), one managed node group, core addons + EBS CSI, access entries |
| `ecr.tf` | 3 ECR repos with scan-on-push + lifecycle policies (keep last 10, expire untagged) |
| `rds.tf` | PostgreSQL 16 (`db.t4g.micro`), SG open only to the node group |
| `secrets.tf` | Secrets Manager secret `yatrusathi/app` (DB URL + generated keys), IRSA for External Secrets |
| `iam-github-oidc.tf` | GitHub OIDC provider + `yatrusathi-github-deploy` role (ECR push + `eks:DescribeCluster`) |
| `addons.tf` | Helm: AWS Load Balancer Controller, External Secrets Operator (both via IRSA) |

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
terraform output                     # cluster_name, ecr_registry, github_deploy_role_arn, app_secret_arn ...
```

### Fill in the real secrets

`secrets.tf` seeds `yatrusathi/app` with `REPLACE_ME` placeholders for the
third-party keys (Terraform ignores later drift on this secret):

```bash
SECRET_ARN=$(terraform output -raw app_secret_arn)
CURRENT=$(aws secretsmanager get-secret-value --secret-id "$SECRET_ARN" --query SecretString --output text)
echo "$CURRENT" | jq '.GROQ_API_KEY="gsk_..." | .RESEND_API_KEY="re_..." | .DJANGO_ADMIN_PASSWORD="..."' \
  | aws secretsmanager put-secret-value --secret-id "$SECRET_ARN" --secret-string file:///dev/stdin
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

The old `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` secrets are **no longer
used** — delete them. `github_repository` / `github_deploy_ref` in
`terraform.tfvars` must match this repo and the branch you deploy from, or the
role's trust policy will reject the OIDC token.

---

## 3. First deploy

Two paths — do one manually first so you can watch it, then let CI take over.

### Manual

```bash
aws eks update-kubeconfig --name "$(terraform -chdir=infra/terraform output -raw cluster_name)" --region ap-south-1

cd k8s/overlays/production
REGISTRY=$(terraform -chdir=../../../infra/terraform output -raw ecr_registry)
kustomize edit set image \
  backend=$REGISTRY/yatru-sathi-backend:latest \
  frontend=$REGISTRY/yatru-sathi-frontend:latest \
  chatbot=$REGISTRY/yatru-sathi-chatbot:latest
kubectl apply -k .
kubectl -n yatrusathi rollout status deployment/backend
```

### CI

Push to `main`. The `deploy` job resolves the registry from the caller
identity, stamps the commit SHA as the image tag, applies the overlay and
waits for all three rollouts.

---

## 4. Point clients at the load balancer

```bash
kubectl -n yatrusathi get ingress yatrusathi -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

That ALB DNS name routes:

| Path | Service |
| --- | --- |
| `/socket.io`, `/api/chat`, `/api/session` | chatbot |
| `/api`, `/admin`, `/static` | backend |
| `/` (everything else) | frontend |

Because the chatbot and backend sit behind the **same host**, the frontend
bundle must be built with `VITE_API_BASE_URL=https://<alb>/api/` and
`VITE_CHATBOT_URL=https://<alb>` (no domain needed). Set those as build args
when CI builds the frontend image, then rebuild.

Then tighten Django's host allow-list (it ships as `*`):

```bash
kubectl -n yatrusathi patch configmap yatrusathi-config --type merge -p \
  '{"data":{"ALLOWED_HOSTS":"<alb-dns>","CORS_ALLOWED_ORIGINS":"https://<alb-dns>","CSRF_TRUSTED_ORIGINS":"https://<alb-dns>"}}'
kubectl -n yatrusathi rollout restart deployment/backend
```

(Or bake the value into `k8s/overlays/production/kustomization.yaml` — there is
already a patch stub there.)

For a real domain: create an ACM cert, add `{"HTTPS":443}` to the Ingress
`listen-ports` annotation with `certificate-arn`, add an `ssl-redirect` action,
and point a Route 53 alias at the ALB.

---

## Known limitations / follow-ups

- **Chatbot runs as a single replica** (`replicas: 1`, `Recreate`). Flask-SocketIO
  threading mode keeps rooms + session history in memory. Horizontal scale needs
  a Redis message queue (`socketio.Server(message_queue=...)`) and sticky routing.
- **Migrations run as an initContainer** on the backend pod — fine for a small
  app; concurrent rollouts could race. Promote to a pre-deploy `Job` / Helm hook
  for zero-downtime.
- **HTTP only** until a domain + ACM cert are added.
- **Single NAT gateway** and single-AZ RDS by default (`db_multi_az = false`) to
  keep the demo cheap — not HA.
- `db.seed` (`scripts/seed_db.py`) is **not** run automatically; apply it as a
  one-off `kubectl run` / Job if you want the sample catalogue.
