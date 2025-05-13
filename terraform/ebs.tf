# Service role creation for elastic beanstalk
data "aws_iam_policy_document" "assume_role" {
  statement {
    effect = "Allow"

    principals {
      type = "Service"
      identifiers = [
        "ec2.amazonaws.com",
        "elasticbeanstalk.amazonaws.com",
        "ecs.amazonaws.com",
        "cloudformation.amazonaws.com"
      ]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "aws_ebs_service_role" {
  name               = "aws_ebs_service_role"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
  tags               = var.common_tags
}

# Attaching policies to role
resource "aws_iam_role_policy_attachment" "AWSElasticBeanstalkWebTier" {
  role       = aws_iam_role.aws_ebs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier"
}

resource "aws_iam_role_policy_attachment" "AWSElasticBeanstalkWorkerTier" {
  role       = aws_iam_role.aws_ebs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier"
}

resource "aws_iam_role_policy_attachment" "AWSElasticBeanstalkMulticontainerDocker" {
  role       = aws_iam_role.aws_ebs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker"
}

resource "aws_iam_role_policy_attachment" "AutoScalingFullAccess" {
  role       = aws_iam_role.aws_ebs_service_role.name
  policy_arn = "arn:aws:iam::aws:policy/AutoScalingFullAccess"
}

resource "aws_iam_instance_profile" "aws_ebs_profile" {
  name = "aws-elasticbeanstalk-ec2-role"

  role = aws_iam_role.aws_ebs_service_role.name
}

# Environment and application setup
module "key_pair" {
  source             = "terraform-aws-modules/key-pair/aws"
  key_name           = "ebs-ec2-key"
  create_private_key = true
}

resource "aws_elastic_beanstalk_application" "app_30_seconds" {
  name        = "30-seconds-app"
  description = "30 seconds App"
  tags        = var.common_tags
}

resource "aws_elastic_beanstalk_environment" "app_30_seconds_env" {
  name                = "30-seconds-app-env"
  application         = aws_elastic_beanstalk_application.app_30_seconds.name
  solution_stack_name = "64bit Amazon Linux 2023 v6.5.1 running Node.js 22"
  cname_prefix        = "30-seconds"
  tags                = var.common_tags

  setting {
    namespace = "aws:ec2:vpc"
    name      = "VPCId"
    value     = aws_vpc.default_vpc.id
  }

  setting {
    namespace = "aws:ec2:vpc"
    name      = "Subnets"
    value     = join(",", aws_subnet.public_subnets[*].id)
  }

  setting {
    namespace = "aws:ec2:instances"
    name      = "InstanceTypes"
    value     = "t3.micro,t3.small"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "EnvironmentType"
    value     = "SingleInstance"
  }

  setting {
    namespace = "aws:elasticbeanstalk:environment"
    name      = "ServiceRole"
    value     = aws_iam_role.aws_ebs_service_role.name
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "EC2KeyName"
    value     = module.key_pair.key_pair_name
  }

  setting {
    namespace = "aws:autoscaling:launchconfiguration"
    name      = "IamInstanceProfile"
    value     = aws_iam_instance_profile.aws_ebs_profile.name
  }
}

output "url" {
  value = aws_elastic_beanstalk_environment.app_30_seconds_env.endpoint_url
}