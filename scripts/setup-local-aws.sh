#!/bin/bash
set -euo pipefail

export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# RDS
aws rds create-db-instance \
	--db-instance-identifier animus-mysql \
	--engine mysql \
	--db-instance-class db.t3.micro \
	--allocated-storage 5 \
	--master-username admin \
	--master-user-password password \
	--db-name animus
aws rds wait db-instance-available --db-instance-identifier animus-mysql

# S3
aws s3api create-bucket --bucket animus-raw-files
aws s3api create-bucket --bucket animus-dash-files
aws s3api put-bucket-cors --bucket animus-raw-files --cors-configuration \
	'{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["PUT"],"AllowedHeaders":["*"],"ExposeHeaders":["ETag"],"MaxAgeSeconds":3000}]}'
aws s3api put-bucket-cors --bucket animus-dash-files --cors-configuration \
	'{"CORSRules":[{"AllowedOrigins":["*"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"],"ExposeHeaders":["Content-Length","Content-Range","Accept-Ranges","ETag"],"MaxAgeSeconds":3000}]}'

# SQS
aws sqs create-queue --queue-name animus-transcode-jobs \
	--attributes VisibilityTimeout=1800,MessageRetentionPeriod=86400
aws sqs get-queue-url --queue-name animus-transcode-jobs --query QueueUrl --output text
