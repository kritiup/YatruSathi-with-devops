# App secrets live in one Secrets Manager secret as JSON. External Secrets
# Operator (installed in addons.tf) syncs it into a Kubernetes Secret that
# the Deployments consume via envFrom.

resource "random_password" "django_secret_key" {
  for_each = toset(["production", "staging"])
  length   = 64
  special  = false
}

locals {
  # host:port from the shared RDS instance; staging uses a separate database
  # name on the same instance (create it once: CREATE DATABASE "<db_name>_staging").
  db_names = {
    production = var.db_name
    staging    = "${var.db_name}_staging"
  }
  database_urls = {
    for env, dbname in local.db_names :
    env => format("postgres://%s:%s@%s/%s", var.db_username, random_password.db.result, module.db.db_instance_endpoint, dbname)
  }
}

# One Secrets Manager secret per environment: yatrusathi/app and
# yatrusathi/app-staging.
resource "aws_secretsmanager_secret" "app" {
  for_each = toset(["production", "staging"])

  name                    = each.key == "production" ? "${var.name}/app" : "${var.name}/app-${each.key}"
  description             = "Runtime secrets for the YatruSathi ${each.key} workloads"
  recovery_window_in_days = 0 # demo; raise for production
}

resource "aws_secretsmanager_secret_version" "app" {
  for_each  = aws_secretsmanager_secret.app
  secret_id = each.value.id

  # Placeholder values for third-party keys — set the real ones in the console
  # (or via CLI) after the first apply; External Secrets picks up the change.
  secret_string = jsonencode({
    DATABASE_URL          = local.database_urls[each.key]
    DJANGO_SECRET_KEY     = random_password.django_secret_key[each.key].result
    CHATBOT_SECRET_KEY    = random_password.django_secret_key[each.key].result
    GROQ_API_KEY          = "REPLACE_ME"
    RESEND_API_KEY        = "REPLACE_ME"
    DJANGO_ADMIN_PASSWORD = "REPLACE_ME"
  })

  lifecycle {
    # Don't clobber console-side edits to the third-party keys on every apply.
    ignore_changes = [secret_string]
  }
}

# ── IRSA role for External Secrets Operator ────────────────────────────────
data "aws_iam_policy_document" "external_secrets" {
  statement {
    sid       = "ReadAppSecrets"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [for s in aws_secretsmanager_secret.app : s.arn]
  }
}

resource "aws_iam_policy" "external_secrets" {
  name   = "${var.name}-external-secrets"
  policy = data.aws_iam_policy_document.external_secrets.json
}

module "external_secrets_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.48"

  role_name = "${var.name}-external-secrets"

  role_policy_arns = {
    read = aws_iam_policy.external_secrets.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["external-secrets:external-secrets"]
    }
  }
}
