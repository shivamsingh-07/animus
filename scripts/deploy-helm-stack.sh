#!/bin/bash
set -euo pipefail

ROLE_ARN="arn:aws:iam::<account-id>:role/animus-cluster-irsa"
MYSQL_HOST="animus-cluster-mysql.<id>.<region>.rds.amazonaws.com"
MYSQL_PASSWORD="<rds-password>"
SQS_QUEUE_URL="https://sqs.<region>.amazonaws.com/<account-id>/animus-transcode-jobs"
DASH_BASE_URL="https://<distribution>.cloudfront.net"
TMDB_API_KEY="<tmdb-api-key>"
TMDB_ACCESS_TOKEN="<tmdb-access-token>"

step() {
	echo
	echo "[$1] $2"
}

for v in ROLE_ARN MYSQL_HOST MYSQL_PASSWORD SQS_QUEUE_URL DASH_BASE_URL; do
	val="${!v}"
	if [ -z "$val" ] || [ "${val#*<}" != "$val" ]; then
		echo "Set $v at the top of $(basename "$0") before deploying." >&2
		exit 1
	fi
done

step 1/2 "Installing KEDA (scales the transcode worker)"
helm repo add kedacore https://kedacore.github.io/charts &>/dev/null
helm repo update &>/dev/null
helm upgrade --install keda kedacore/keda -n keda --create-namespace --wait --timeout 300s

step 2/2 "Deploying ANIMUS"
helm upgrade --install animus helm --namespace default --wait --timeout 600s \
	--set-string serviceAccount.roleArn="$ROLE_ARN" \
	--set-string config.mysql.host="$MYSQL_HOST" \
	--set-string config.sqsQueueUrl="$SQS_QUEUE_URL" \
	--set-string config.dashBaseUrl="$DASH_BASE_URL" \
	--set-string secrets.mysqlPassword="$MYSQL_PASSWORD" \
	--set-string secrets.tmdbApiKey="$TMDB_API_KEY" \
	--set-string secrets.tmdbAccessToken="$TMDB_ACCESS_TOKEN"

echo
echo "Deployed. Access:"
echo "  - Client: http://animus.com"
echo "  - Admin: http://admin.animus.com"
