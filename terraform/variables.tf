variable "aws_region" {
  default = "ap-south-1"
}

variable "cluster_name" {
  default = "animus-cluster"
}

variable "kubernetes_version" {
  default = "1.35"
}

variable "vpc_cidr" {
  default = "10.0.0.0/16"
}

variable "raw_bucket_name" {
  default = "animus-raw-files"
}

variable "dash_bucket_name" {
  default = "animus-dash-files"
}

variable "db_name" {
  default = "animus"
}

variable "db_username" {
  default = "admin"
}

variable "db_password" {
  sensitive = true
}
