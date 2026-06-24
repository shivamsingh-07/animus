output "region" {
  value = var.aws_region
}

output "cluster_name" {
  value = module.eks.cluster_name
}

output "configure_kubectl" {
  description = "Run this to point kubectl at the cluster."
  value       = "aws eks update-kubeconfig --region ${var.aws_region} --name ${module.eks.cluster_name}"
}

output "role_arn" {
  description = "ROLE_ARN — serviceAccount.roleArn"
  value       = aws_iam_role.irsa.arn
}

output "mysql_host" {
  description = "MYSQL_HOST — config.mysql.host"
  value       = aws_db_instance.mysql.address
}

output "sqs_queue_url" {
  description = "SQS_QUEUE_URL — config.sqsQueueUrl"
  value       = aws_sqs_queue.transcode-queue.url
}

output "dash_base_url" {
  description = "DASH_BASE_URL — config.dashBaseUrl"
  value       = "https://${aws_cloudfront_distribution.dash.domain_name}"
}
