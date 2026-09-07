# infra/terraform — AWS EKS platform for YatruSathi

Provisions everything the app runs on: VPC, EKS, ECR, RDS Postgres, Secrets
Manager, the GitHub OIDC deploy role, and the in-cluster controllers (AWS Load
Balancer Controller + External Secrets Operator).

Full walkthrough: [`../../docs/deployment-eks.md`](../../docs/deployment-eks.md).

## Quick start

```bash
cp terraform.tfvars.example terraform.tfvars   # edit region, github_repository, cluster_admin_principals
cp backend.tf.example backend.tf               # optional: S3 remote state

terraform init
terraform apply
terraform output
```

## Layout

| File | Purpose |
| --- | --- |
| `versions.tf` | Provider versions + aws/kubernetes/helm provider config |
| `variables.tf` | Every tunable, with defaults (applies with an empty tfvars) |
| `network.tf` | VPC via `terraform-aws-modules/vpc` |
| `eks.tf` | Cluster, node group, addons, EKS access entries |
| `ecr.tf` | Three repos + lifecycle policies |
| `rds.tf` | PostgreSQL 16 + security group |
| `secrets.tf` | Secrets Manager `yatrusathi/app` + External Secrets IRSA |
| `iam-github-oidc.tf` | GitHub OIDC provider + `yatrusathi-github-deploy` role |
| `addons.tf` | Helm releases for ALB controller + External Secrets |
| `outputs.tf` | `cluster_name`, `ecr_registry`, `github_deploy_role_arn`, `app_secret_arn`, … |

## Notes

- Requires Terraform ≥ 1.6 and AWS credentials with broad create rights for the
  first apply (an admin profile). CI never runs `terraform` — it only assumes
  the narrow deploy role this config creates.
- `terraform.lock.hcl` is committed; `*.tfvars`, `*.tfstate`, `backend.tf` and
  `.terraform/` are gitignored.
- `terraform destroy` tears it all down. ECR repos use `force_delete` and the
  secret uses a 0-day recovery window, so destroy is clean for a demo account.
