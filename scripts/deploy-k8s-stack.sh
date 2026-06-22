#!/bin/bash
set -euo pipefail

step() {
	echo
	echo "[$1] $2"
}

step 1/7 "Installing KEDA"
helm repo add kedacore https://kedacore.github.io/charts &>/dev/null
helm repo update &>/dev/null
helm upgrade --install keda kedacore/keda -n keda --create-namespace --wait --timeout 300s

step 2/7 "Applying config + secrets"
kubectl apply -f ../kubernetes/config.yaml

step 3/7 "Deploying API"
kubectl apply -f ../kubernetes/api.yaml
kubectl rollout status deploy/animus-api --timeout=180s

step 4/7 "Deploying frontends (client + admin)"
kubectl apply -f ../kubernetes/client.yaml
kubectl apply -f ../kubernetes/admin.yaml
kubectl rollout status deploy/animus-client --timeout=120s
kubectl rollout status deploy/animus-admin --timeout=120s

step 5/7 "Deploying transcoder worker"
kubectl apply -f ../kubernetes/transcode.yaml

step 6/7 "Applying KEDA autoscaler"
kubectl apply -f ../kubernetes/autoscaler.yaml

step 7/7 "Applying ingress"
kubectl apply -f ../kubernetes/ingress.yaml

echo
echo "Stack deployed. Access:"
echo "  - Client: http://animus.com"
echo "  - Admin: http://admin.animus.com"
