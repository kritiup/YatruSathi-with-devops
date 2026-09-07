resource "random_password" "db" {
  length  = 32
  special = false # keeps the value safe to drop straight into a URL
}

resource "aws_security_group" "db" {
  name        = "${var.name}-db"
  description = "Postgres access from the EKS worker nodes only"
  vpc_id      = module.vpc.vpc_id

  ingress {
    description     = "Postgres from EKS nodes"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [module.eks.node_security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

module "db" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.10"

  identifier = "${var.name}-postgres"

  engine               = "postgres"
  engine_version       = "16"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_allocated_storage * 3
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = random_password.db.result
  port     = 5432

  # We hand the password to the app ourselves via Secrets Manager (secrets.tf),
  # so let Terraform set it rather than RDS-managed rotation.
  manage_master_user_password = false

  multi_az               = var.db_multi_az
  create_db_subnet_group = true
  subnet_ids             = module.vpc.private_subnets
  vpc_security_group_ids = [aws_security_group.db.id]

  deletion_protection          = false # demo; turn on for production
  skip_final_snapshot          = true
  backup_retention_period      = 7
  performance_insights_enabled = false
}
