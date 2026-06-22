#!/bin/bash

set -e

PROFILE="animus"

cluster_exists() {
	minikube profile list -o json | grep -q "$PROFILE"
}

patch_coredns() {
	if kubectl -n kube-system get cm coredns -o jsonpath='{.data.Corefile}' | grep -q "aws.animus.com"; then
		echo "🌐 aws.animus.com already mapped in CoreDNS — skipping"
		return
	fi

	echo "🌐 Mapping aws.animus.com -> host gateway in CoreDNS..."
	kubectl -n kube-system get cm coredns -o json | python3 -c '
import json, re, sys
cm = json.load(sys.stdin)
cf = cm["data"]["Corefile"]
m = re.search(r"(\S+)\s+host\.minikube\.internal", cf)
ip = m.group(1) if m else "192.168.49.1"
cm["data"]["Corefile"] = cf.replace(ip + " host.minikube.internal", ip + " host.minikube.internal\n       " + ip + " aws.animus.com")
print(json.dumps({"apiVersion": "v1", "kind": "ConfigMap", "metadata": {"name": "coredns", "namespace": "kube-system"}, "data": cm["data"]}))
' | kubectl apply -f -

	kubectl -n kube-system rollout restart deploy/coredns
}

patch_transcoder_resources() {
	echo "🎚️ Sizing ${PROFILE}-m03 (transcoder) to 3 CPU / 3GB..."
	docker update --cpus 3 --memory 3g ${PROFILE}-m03 >/dev/null
	kubectl taint node ${PROFILE}-m03 node-role.kubernetes.io/worker=worker:NoSchedule --overwrite
}

FLOCI_RDS_ADDR="172.17.0.2:7001"

bridge_floci_rds() {
	local port="${FLOCI_RDS_ADDR##*:}"
	if ! command -v socat >/dev/null 2>&1; then
		echo "⚠️ socat not installed — pods can't reach Floci RDS (try: sudo apt install socat)"
		return
	fi
	pkill -f "socat TCP-LISTEN:${port}" 2>/dev/null || true
	echo "🔌 Bridging Floci RDS ${FLOCI_RDS_ADDR} -> 0.0.0.0:${port} (pods reach it as aws.animus.com:${port})..."
	nohup socat "TCP-LISTEN:${port},fork,reuseaddr" "TCP:${FLOCI_RDS_ADDR}" >/dev/null 2>&1 &
}

stop_floci_rds_bridge() {
	local port="${FLOCI_RDS_ADDR##*:}"
	pkill -f "socat TCP-LISTEN:${port}" 2>/dev/null && echo "🔌 Stopped Floci RDS bridge" || true
}

create_cluster() {
	echo "🚀 Creating 3-node cluster (1 master + 2 workers)..."
	minikube start -p $PROFILE --nodes 3 --memory 2048 --cni=flannel

	echo "⏳ Waiting for nodes to be ready..."
	kubectl wait --for=condition=Ready nodes --all --timeout=180s

	echo "🏷️ Labeling worker nodes..."
	kubectl label node ${PROFILE}-m02 node-role.kubernetes.io/worker=worker role=application
	kubectl label node ${PROFILE}-m03 node-role.kubernetes.io/worker=worker role=transcoder

	patch_transcoder_resources

	echo "📊 Enabling metrics server..."
	minikube addons enable metrics-server -p $PROFILE

	echo "🔗 Enabling ingress..."
	minikube addons enable ingress -p $PROFILE

	echo "💾 Enabling rancher local-path storage provisioner..."
	minikube addons enable storage-provisioner-rancher -p $PROFILE

	patch_coredns
	bridge_floci_rds

	echo "✅ Cluster ready!"
	kubectl get nodes -o wide
}

start_cluster() {
	if cluster_exists; then
		echo "▶️ Starting existing cluster..."
		minikube start -p $PROFILE
		patch_coredns
		patch_transcoder_resources
		bridge_floci_rds
		echo "✅ Cluster ready!"
		kubectl get nodes -o wide
	else
		echo "⚠️ Cluster not found. Creating a new one..."
		create_cluster
		return
	fi
}

stop_cluster() {
	if cluster_exists; then
		echo "🛑 Stopping cluster..."
		minikube stop -p $PROFILE
		stop_floci_rds_bridge
		echo "⏸️ Cluster stopped."
	else
		echo "⚠️ Cluster does not exist."
	fi
}

delete_cluster() {
	if cluster_exists; then
		echo "🔥 Deleting cluster..."
		minikube delete -p $PROFILE
		stop_floci_rds_bridge
		echo "🗑️ Cluster deleted."
	else
		echo "⚠️ Cluster does not exist."
	fi
}

status_cluster() {
	if cluster_exists; then
		echo "📊 Cluster status:"
		minikube status -p $PROFILE
		kubectl get nodes
	else
		echo "⚠️ Cluster does not exist."
	fi
}

case "$1" in
create)
	create_cluster
	;;
start)
	start_cluster
	;;
stop)
	stop_cluster
	;;
delete)
	delete_cluster
	;;
status)
	status_cluster
	;;
*)
	echo "Usage: $0 {create|start|stop|delete|status}"
	exit 1
	;;
esac
