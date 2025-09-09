terraform {
  required_version = ">= 1.0"
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "cloudflare_account_id" {
  description = "Cloudflare Account ID"
  type        = string
  default     = ""
}

variable "cloudflare_api_token" {
  description = "Cloudflare API Token"
  type        = string
  sensitive   = true
  default     = ""
}

variable "b2_key_id" {
  description = "Backblaze B2 Key ID"
  type        = string
  default     = ""
}

variable "b2_application_key" {
  description = "Backblaze B2 Application Key"
  type        = string
  sensitive   = true
  default     = ""
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "dev"
}

# Cloudflare R2 Configuration
provider "cloudflare" {
  api_token  = var.cloudflare_api_token
  count      = var.cloudflare_account_id != "" ? 1 : 0
}

# R2 Bucket for evidence storage
resource "cloudflare_r2_bucket" "evidence_bucket" {
  count      = var.cloudflare_account_id != "" ? 1 : 0
  account_id = var.cloudflare_account_id
  name       = "agent-court-evidence-${var.environment}"
  location   = "auto"
}

# R2 API Token for bucket access
resource "cloudflare_api_token" "r2_token" {
  count = var.cloudflare_account_id != "" ? 1 : 0
  name  = "agent-court-r2-${var.environment}"

  policy {
    permission_groups = [
      data.cloudflare_api_token_permission_groups.all.r2["Object Read"],
      data.cloudflare_api_token_permission_groups.all.r2["Object Write"],
    ]
    resources = {
      "com.cloudflare.api.account.${var.cloudflare_account_id}" = "*"
    }
  }
}

data "cloudflare_api_token_permission_groups" "all" {
  count = var.cloudflare_account_id != "" ? 1 : 0
}

# AWS Provider for Backblaze B2 (S3-compatible)
provider "aws" {
  alias                   = "b2"
  region                  = "us-west-000"
  endpoint                = "https://s3.us-west-000.backblazeb2.com"
  access_key             = var.b2_key_id
  secret_key             = var.b2_application_key
  skip_credentials_validation = true
  skip_metadata_api_check     = true
  skip_region_validation      = true
  count                       = var.b2_key_id != "" ? 1 : 0
}

# B2 Bucket for evidence storage
resource "aws_s3_bucket" "b2_evidence_bucket" {
  count    = var.b2_key_id != "" ? 1 : 0
  provider = aws.b2
  bucket   = "agent-court-evidence-${var.environment}"
}

# B2 Bucket versioning
resource "aws_s3_bucket_versioning" "b2_evidence_versioning" {
  count    = var.b2_key_id != "" ? 1 : 0
  provider = aws.b2
  bucket   = aws_s3_bucket.b2_evidence_bucket[0].id
  versioning_configuration {
    status = "Enabled"
  }
}

# B2 Bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "b2_evidence_lifecycle" {
  count    = var.b2_key_id != "" ? 1 : 0
  provider = aws.b2
  bucket   = aws_s3_bucket.b2_evidence_bucket[0].id

  rule {
    id     = "evidence_lifecycle"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# Outputs
output "r2_bucket_name" {
  description = "R2 bucket name for evidence storage"
  value       = var.cloudflare_account_id != "" ? cloudflare_r2_bucket.evidence_bucket[0].name : null
}

output "r2_endpoint" {
  description = "R2 endpoint URL"
  value       = var.cloudflare_account_id != "" ? "https://${var.cloudflare_account_id}.r2.cloudflarestorage.com" : null
}

output "b2_bucket_name" {
  description = "B2 bucket name for evidence storage"
  value       = var.b2_key_id != "" ? aws_s3_bucket.b2_evidence_bucket[0].bucket : null
}

output "b2_endpoint" {
  description = "B2 endpoint URL"
  value       = var.b2_key_id != "" ? "https://s3.us-west-000.backblazeb2.com" : null
}

# Example terraform.tfvars file
resource "local_file" "tfvars_example" {
  filename = "${path.module}/terraform.tfvars.example"
  content = <<-EOT
# Cloudflare R2 Configuration
cloudflare_account_id = "your-cloudflare-account-id"
cloudflare_api_token  = "your-cloudflare-api-token"

# Backblaze B2 Configuration (alternative to R2)
b2_key_id           = "your-b2-key-id"
b2_application_key  = "your-b2-application-key"

# Environment
environment = "dev"
EOT
}
