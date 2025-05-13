# Subnet Group
resource "aws_db_subnet_group" "db_subnet_group" {
  name       = "${var.vpc_name}-subnet-group"
  subnet_ids = aws_subnet.public_subnets[*].id

  tags = var.common_tags
}

resource "aws_vpc_security_group_ingress_rule" "allow_tcp" {
  security_group_id = aws_security_group.allow_tcp.id
  from_port         = var.db_port
  to_port           = var.db_port
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

resource "aws_vpc_security_group_egress_rule" "allow_tcp" {
  security_group_id = aws_security_group.allow_tcp.id
  from_port         = var.db_port
  to_port           = var.db_port
  ip_protocol       = "tcp"
  cidr_ipv4         = "0.0.0.0/0"
}

#########################################
# DATABASE
#########################################
# RDS Database

resource "aws_db_instance" "db_instance_30_seconds" {
  identifier              = "db-30-seconds"
  engine                  = "sqlserver-ex"
  engine_version          = "15.00.4415.2.v1"
  instance_class          = "db.t3.micro"
  allocated_storage       = 20
  publicly_accessible     = true
  backup_retention_period = 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:05:00-sun:06:00"
  skip_final_snapshot     = true
  port                    = var.db_port
  username                = var.db_username
  password                = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.db_subnet_group.name
  vpc_security_group_ids  = [aws_security_group.allow_tcp.id]
}


resource "null_resource" "create_db2" {
  depends_on = [aws_db_instance.db_instance_30_seconds]
  provisioner "local-exec" {
    command     = <<-EOT
      sqlcmd -S ${replace(aws_db_instance.db_instance_30_seconds.endpoint, ":", ",")} -U ${var.db_username} -P ${var.db_password}  -Q "CREATE DATABASE [${var.db_name}];"
    EOT
    interpreter = ["PowerShell", "-Command"]
  }

}



