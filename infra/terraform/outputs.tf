output "aws_region" {
  value = var.aws_region
}

output "cluster_name" {
  description = "Pass to: aws eks update-kubeconfig --name <this>"
  value       = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "ecr_registry" {
  description = "<account>.dkr.ecr.<region>.amazonaws.com"
  value       = split("/", values(aws_ecr_repository.this)[0].repository_url)[0]
}

output "ecr_repository_urls" {
  value = { for k, r in aws_ecr_repository.this : k => r.repository_url }
}

output "github_deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN GitHub Actions variable."
  value       = module.github_deploy_role.arn
}

output "db_endpoint" {
  value = module.db.db_instance_endpoint
}

output "app_secret_arn" {
  description = "Secrets Manager secret the ExternalSecret reads. Set real API keys here."
  value       = aws_secretsmanager_secret.app.arn
}
