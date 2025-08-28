#!/bin/bash

set -euo pipefail

# This script performs a safe backup before a cluster upgrade.
# It captures:
# 1) etcd snapshot (on stacked etcd control-plane)
# 2) Kubernetes PKI and config
# 3) Static pod manifests and addon manifests
# 4) Cluster-wide resources and namespaces as YAML

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root" >&2
  exit 1
fi

BACKUP_DIR=${1:-/var/backups/k8s-$(date +%Y%m%d-%H%M%S)}
mkdir -p "$BACKUP_DIR"

echo "Backing up to: $BACKUP_DIR"

# Discover etcd endpoint for stacked etcd
ETCD_POD=$(crictl ps --name etcd -q || true)
if [[ -n "$ETCD_POD" ]]; then
  echo "Detected stacked etcd; attempting snapshot"
  export ETCDCTL_API=3
  ENDPOINT="https://127.0.0.1:2379"
  ETCDCTL_CERT="/etc/kubernetes/pki/etcd/peer.crt"
  ETCDCTL_KEY="/etc/kubernetes/pki/etcd/peer.key"
  ETCDCTL_CACERT="/etc/kubernetes/pki/etcd/ca.crt"
  if command -v etcdctl >/dev/null 2>&1; then
    echo "Using host etcdctl"
    etcdctl --endpoints=$ENDPOINT --cert=$ETCDCTL_CERT --key=$ETCDCTL_KEY --cacert=$ETCDCTL_CACERT snapshot save "$BACKUP_DIR/etcd-snapshot.db"
    etcdctl --write-out=table --endpoints=$ENDPOINT --cert=$ETCDCTL_CERT --key=$ETCDCTL_KEY --cacert=$ETCDCTL_CACERT endpoint status | tee "$BACKUP_DIR/etcd-endpoint-status.txt"
  else
    echo "Host etcdctl not found; using etcdctl inside etcd pod"
    POD_NAME=$(kubectl -n kube-system get pods -l component=etcd -o jsonpath='{.items[0].metadata.name}')
    if [[ -z "$POD_NAME" ]]; then
      echo "ERROR: Could not find etcd pod in kube-system namespace." >&2
      exit 1
    fi
    TS=$(date +%Y%m%d-%H%M%S)
    # Write snapshot to host-mounted etcd data directory so we can read it from host
    SNAP_IN_POD="/var/lib/etcd/etcd-snapshot-$TS.db"
    SNAP_ON_HOST="/var/lib/etcd/etcd-snapshot-$TS.db"
    kubectl -n kube-system exec "$POD_NAME" -- sh -c "ETCDCTL_API=3 etcdctl --endpoints=$ENDPOINT --cert=$ETCDCTL_CERT --key=$ETCDCTL_KEY --cacert=$ETCDCTL_CACERT snapshot save $SNAP_IN_POD"
    if [ -f "$SNAP_ON_HOST" ]; then
      cp "$SNAP_ON_HOST" "$BACKUP_DIR/etcd-snapshot.db"
      rm -f "$SNAP_ON_HOST" || true
    else
      echo "WARNING: Expected snapshot at $SNAP_ON_HOST not found on host. Attempting stream copy fallback."
      kubectl -n kube-system exec "$POD_NAME" -- sh -c "cat $SNAP_IN_POD" > "$BACKUP_DIR/etcd-snapshot.db" || true
      kubectl -n kube-system exec "$POD_NAME" -- rm -f "$SNAP_IN_POD" || true
    fi
    kubectl -n kube-system exec "$POD_NAME" -- sh -c "ETCDCTL_API=3 etcdctl --write-out=table --endpoints=$ENDPOINT --cert=$ETCDCTL_CERT --key=$ETCDCTL_KEY --cacert=$ETCDCTL_CACERT endpoint status" | tee "$BACKUP_DIR/etcd-endpoint-status.txt" || true
  fi
else
  echo "No local etcd container found. If using external etcd, snapshot it separately."
fi

echo "Copying PKI, kubeconfigs, and manifests"
tar -C / -czf "$BACKUP_DIR/k8s-pki-kubeconfigs-manifests.tgz" \
  etc/kubernetes/pki \
  etc/kubernetes/admin.conf \
  etc/kubernetes/controller-manager.conf \
  etc/kubernetes/scheduler.conf \
  etc/kubernetes/kubelet.conf \
  etc/kubernetes/manifests || true

echo "Exporting cluster resources to YAML"
kubectl get ns -o yaml > "$BACKUP_DIR/namespaces.yaml"
kubectl get nodes -o yaml > "$BACKUP_DIR/nodes.yaml"
kubectl api-resources --verbs=list --namespaced -o name | xargs -I{} sh -c 'kubectl get {} --all-namespaces -o yaml || true' > "$BACKUP_DIR/all-namespaced-resources.yaml" || true
kubectl api-resources --verbs=list --namespaced=false -o name | xargs -I{} sh -c 'kubectl get {} -o yaml || true' > "$BACKUP_DIR/all-cluster-resources.yaml" || true

echo "Capturing addon manifests (if present)"
mkdir -p "$BACKUP_DIR/addons"
kubectl -n kube-system get cm -o yaml > "$BACKUP_DIR/addons/kube-system-configmaps.yaml" || true

echo "Creating inventory summary"
kubectl version -o yaml > "$BACKUP_DIR/kubectl-version.yaml" || true
crictl version > "$BACKUP_DIR/crictl-version.txt" || true
containerd --version > "$BACKUP_DIR/containerd-version.txt" || true

echo "Backup completed: $BACKUP_DIR"


