data "aws_caller_identity" "current" {}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]
}

resource "aws_iam_role" "github_actions" {
  name = "GitHubActionsOIDCRole"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/token.actions.githubusercontent.com"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          },
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:nkabindemnqobi/30-Seconds:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "github_actions_deployment" {
  name = "GitHubActionsDeploymentAccess"
  role = aws_iam_role.github_actions.name

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "s3:GetObject",
          "s3:ListBucket",
          "s3:PutObject",
          "s3:GetBucketLocation",
          "s3:DeleteObject"
        ],
        Resource = [
          "arn:aws:s3:::30-seconds-game",
          "arn:aws:s3:::30-seconds-game/*",
          "arn:aws:s3:::my-30-seconds",
          "arn:aws:s3:::my-30-seconds/*"
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "cloudformation:GetTemplate",
          "cloudformation:DescribeStacks",
          "cloudformation:DescribeStackResource",
          "cloudformation:DescribeStackResources",
          "cloudformation:DescribeStackEvents",
          "cloudformation:ValidateTemplate"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "elasticbeanstalk:CreateApplicationVersion",
          "elasticbeanstalk:UpdateEnvironment",
          "elasticbeanstalk:DescribeEnvironments",
          "elasticbeanstalk:DescribeApplicationVersions"
        ],
        Resource = "*"
      },
      {
        Effect = "Allow",
        Action = [
          "s3:CreateBucket",
          "s3:PutBucketOwnershipControls",
          "s3:GetBucketOwnershipControls",
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ],
        Resource = [
          "arn:aws:s3:::elasticbeanstalk-${var.region}-${data.aws_caller_identity.current.account_id}",
          "arn:aws:s3:::elasticbeanstalk-${var.region}-${data.aws_caller_identity.current.account_id}/*"
        ]
      }
    ]
  })
}

resource "aws_s3_bucket_policy" "frontend_policy" {
  bucket = "my-30-seconds"

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid       = "PublicReadGetObject",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "arn:aws:s3:::my-30-seconds/*"
      }
    ]
  })
}
