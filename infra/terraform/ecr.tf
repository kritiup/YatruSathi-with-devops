# One repository per service. Names match the CI push step:
#   ${REGISTRY}/yatru-sathi-<svc>
locals {
  ecr_repositories = ["yatru-sathi-frontend", "yatru-sathi-backend", "yatru-sathi-chatbot"]
}

resource "aws_ecr_repository" "this" {
  for_each = toset(local.ecr_repositories)

  name                 = each.value
  image_tag_mutability = "MUTABLE" # :latest is re-pointed each deploy
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }
}

# Keep the registry from growing without bound: retain the 10 most recent
# tagged images, drop untagged layers after a day.
resource "aws_ecr_lifecycle_policy" "this" {
  for_each   = aws_ecr_repository.this
  repository = each.value.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire untagged images after 1 day"
        selection = {
          tagStatus   = "untagged"
          countType   = "sinceImagePushed"
          countUnit   = "days"
          countNumber = 1
        }
        action = { type = "expire" }
      },
      {
        rulePriority = 2
        description  = "Keep only the 10 most recent tagged images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = { type = "expire" }
      }
    ]
  })
}
