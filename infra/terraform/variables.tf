variable "aws_region" {
  description = "AWS region for every resource. Matches the CI push-to-ECR region."
  type        = string
  default     = "ap-south-1"
}

variable "name" {
  description = "Name prefix for all resources."
  type        = string
  default     = "yatrusathi"
}

variable "kubernetes_version" {
  description = "EKS control-plane version."
  type        = string
  default     = "1.31"
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.0.0.0/16"
}

variable "node_instance_types" {
  description = "EC2 instance types for the managed node group."
  type        = list(string)
  default     = ["t3.large"]
}

variable "node_desired_size" {
  description = "Desired worker node count."
  type        = number
  default     = 2
}

variable "node_min_size" {
  description = "Minimum worker node count."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum worker node count (headroom for HPA / rollouts)."
  type        = number
  default     = 4
}

variable "db_instance_class" {
  description = "RDS instance class for the Postgres database."
  type        = string
  default     = "db.t4g.micro"
}

variable "db_allocated_storage" {
  description = "RDS storage in GiB."
  type        = number
  default     = 20
}

variable "db_name" {
  description = "Initial database name created on the RDS instance."
  type        = string
  default     = "yatrusathi"
}

variable "db_username" {
  description = "Master username for the RDS instance."
  type        = string
  default     = "yatrusathi"
}

variable "db_multi_az" {
  description = "Run RDS across two AZs. Off by default to keep the demo cheap."
  type        = bool
  default     = false
}

variable "github_repository" {
  description = "owner/repo allowed to assume the CI deploy role via OIDC."
  type        = string
  default     = "kritiup/YatruSathi-with-devops"
}

variable "github_deploy_ref" {
  description = "Git ref (branch) allowed to assume the deploy role. Keep it to the release branch."
  type        = string
  default     = "refs/heads/main"
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub OIDC provider. Set false if the account already has one."
  type        = bool
  default     = true
}

variable "cluster_admin_principals" {
  description = "Extra IAM principal ARNs (your own user/role) to grant cluster-admin via EKS access entries."
  type        = list(string)
  default     = []
}

variable "app_namespace" {
  description = "Kubernetes namespace the workloads run in."
  type        = string
  default     = "yatrusathi"
}
