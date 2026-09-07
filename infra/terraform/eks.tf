module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.31"

  cluster_name    = var.name
  cluster_version = var.kubernetes_version

  # Public endpoint so GitHub-hosted runners and your laptop can reach the API.
  # Lock cluster_endpoint_public_access_cidrs down to known egress ranges for
  # anything beyond a demo.
  cluster_endpoint_public_access       = true
  cluster_endpoint_private_access      = true
  cluster_endpoint_public_access_cidrs = ["0.0.0.0/0"]

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  # IAM Roles for Service Accounts — used by the ALB controller, External
  # Secrets, and the app pods.
  enable_irsa = true

  eks_managed_node_group_defaults = {
    ami_type = "AL2023_x86_64_STANDARD"
    # Lets the CloudWatch agent (Container Insights addon) ship node/pod
    # metrics and container logs.
    iam_role_additional_policies = {
      cloudwatch = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    }
  }

  eks_managed_node_groups = {
    default = {
      instance_types = var.node_instance_types
      desired_size   = var.node_desired_size
      min_size       = var.node_min_size
      max_size       = var.node_max_size
      capacity_type  = "ON_DEMAND"
    }
  }

  # Cluster addons. The EBS CSI driver backs any PersistentVolumeClaim;
  # amazon-cloudwatch-observability is Container Insights (metrics + logs).
  cluster_addons = {
    coredns                         = { most_recent = true }
    kube-proxy                      = { most_recent = true }
    vpc-cni                         = { most_recent = true }
    aws-ebs-csi-driver              = { most_recent = true }
    eks-pod-identity-agent          = { most_recent = true }
    amazon-cloudwatch-observability = { most_recent = true }
  }

  # API-based auth (no aws-auth ConfigMap juggling).
  authentication_mode                      = "API_AND_CONFIG_MAP"
  enable_cluster_creator_admin_permissions = true

  access_entries = merge(
    {
      # The GitHub Actions deploy role — edit rights on the app namespaces only.
      github_ci = {
        principal_arn = module.github_deploy_role.arn
        policy_associations = {
          edit = {
            policy_arn = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSEditPolicy"
            access_scope = {
              type       = "namespace"
              namespaces = [var.app_namespace, "${var.app_namespace}-staging"]
            }
          }
        }
      }
    },
    {
      for arn in var.cluster_admin_principals : "admin_${md5(arn)}" => {
        principal_arn = arn
        policy_associations = {
          admin = {
            policy_arn   = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"
            access_scope = { type = "cluster" }
          }
        }
      }
    }
  )
}
