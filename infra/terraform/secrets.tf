# App secrets live in one Secrets Manager secret as JSON. External Secrets
# Operator (installed in addons.tf) syncs it into a Kubernetes Secret that
# the Deployments consume via envFrom.

resource "random_password" "django_secret_key" {
  length  = 64
  special = false
}

locals {
  database_url = format(
    "postgres://%s:%s@%s/%s",
    var.db_username,
    random_password.db.result,
    module.db.db_instance_endpoint, # host:port
    var.db_name,
  )
}

resource "aws_secretsmanager_secret" "app" {
  name                    = "${var.name}/app"
  description             = "Runtime secrets for the YatruSathi workloads"
  recovery_window_in_days = 0 # demo; raise for production
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id = aws_secretsmanager_secret.app.id

  # Placeholder values for third-party keys — set the real ones in the console
  # (or via CLI) after the first apply; External Secrets picks up the change.
  secret_string = jsonencode({
    DATABASE_URL          = local.database_url
    DJANGO_SECRET_KEY     = random_password.django_secret_key.result
    CHATBOT_SECRET_KEY    = random_password.django_secret_key.result
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
    sid       = "ReadAppSecret"
    effect    = "Allow"
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = [aws_secretsmanager_secret.app.arn]
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
