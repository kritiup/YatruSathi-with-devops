# GitHub Actions authenticates to AWS with a short-lived OIDC token — no
# static AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in GitHub Secrets.

module "github_oidc_provider" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-github-oidc-provider"
  version = "~> 5.48"

  create = var.create_github_oidc_provider
}

module "github_deploy_role" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-github-oidc-role"
  version = "~> 5.48"

  name = "${var.name}-github-deploy"

  # Trust only this repo on the release ref.
  subjects = ["repo:${var.github_repository}:ref:${var.github_deploy_ref}"]

  policies = {
    deploy = aws_iam_policy.github_deploy.arn
  }

  # The role's trust policy names the OIDC provider ARN by convention; make
  # sure the provider resource is created first.
  depends_on = [module.github_oidc_provider]
}

resource "aws_iam_policy" "github_deploy" {
  name        = "${var.name}-github-deploy"
  description = "Push images to ECR and reach the EKS API for kubectl deploys."

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid      = "EcrAuth"
        Effect   = "Allow"
        Action   = ["ecr:GetAuthorizationToken"]
        Resource = "*"
      },
      {
        Sid    = "EcrPushPull"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage",
        ]
        Resource = [for r in aws_ecr_repository.this : r.arn]
      },
      {
        Sid      = "EksDescribeForKubeconfig"
        Effect   = "Allow"
        Action   = ["eks:DescribeCluster"]
        Resource = module.eks.cluster_arn
      },
    ]
  })
}
