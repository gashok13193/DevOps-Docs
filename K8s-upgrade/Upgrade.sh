#!/bin/bash

set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

echo ".........----------------#################._.-.-UPGRADE to v1.31 STABLE-.-._.#################----------------........."

if [[ $(id -u) -ne 0 ]]; then
  echo "Please run as root" >&2
  exit 1
fi

# Prep repo for v1.31 stable minor - force overwrite keyring
KUBE_MINOR=v1.31
mkdir -p /etc/apt/keyrings
rm -f /etc/apt/keyrings/kubernetes-apt-keyring.gpg || true
curl -fsSL https://pkgs.k8s.io/core:/stable:/${KUBE_MINOR}/deb/Release.key | gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
chmod 0644 /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/${KUBE_MINOR}/deb/ /" > /etc/apt/sources.list.d/kubernetes.list

apt-get update

# Get latest 1.31.x patch for each component
KUBEADM_VERSION=$(apt-cache madison kubeadm | awk '/ 1\.31\./{print $3; exit}')
KUBELET_VERSION=$(apt-cache madison kubelet | awk '/ 1\.31\./{print $3; exit}')
KUBECTL_VERSION=$(apt-cache madison kubectl | awk '/ 1\.31\./{print $3; exit}')
PLAIN_VERSION="$(echo "$KUBEADM_VERSION" | sed 's/-.*//')"
if [ -z "$KUBEADM_VERSION" ] || [ -z "$KUBELET_VERSION" ] || [ -z "$KUBECTL_VERSION" ]; then
  echo "ERROR: Could not find 1.31.x versions for kubeadm/kubelet/kubectl."
  echo "Found: kubeadm=[$KUBEADM_VERSION] kubelet=[$KUBELET_VERSION] kubectl=[$KUBECTL_VERSION]" >&2
  exit 1
fi

echo "Target versions: kubeadm=$KUBEADM_VERSION kubelet=$KUBELET_VERSION kubectl=$KUBECTL_VERSION"
echo "Plain upgrade version: $PLAIN_VERSION"

swapoff -a || true

echo "Unholding Kubernetes packages if held..."
apt-mark unhold kubelet kubeadm kubectl >/dev/null 2>&1 || true

echo "Draining control plane node..."
NODE_NAME=$(kubectl get nodes -o jsonpath='{.items[0].metadata.name}')
kubectl drain "$NODE_NAME" --ignore-daemonsets --delete-emptydir-data --force

echo "Upgrading kubeadm to $KUBEADM_VERSION..."
apt-get install -y --allow-downgrades --allow-change-held-packages kubeadm=$KUBEADM_VERSION
echo -n "kubeadm version now: "; kubeadm version -o short || true

echo "Planning upgrade..."
kubeadm upgrade plan | cat

echo "Applying control-plane upgrade to $PLAIN_VERSION..."
kubeadm upgrade apply -y "$PLAIN_VERSION"

echo "Upgrading kubelet to $KUBELET_VERSION and kubectl to $KUBECTL_VERSION..."
apt-get install -y --allow-change-held-packages kubelet=$KUBELET_VERSION kubectl=$KUBECTL_VERSION
echo -n "kubelet binary version: "; kubelet --version || true
echo -n "kubectl client version: "; kubectl version --client --output=yaml | sed -n '1,6p' || true

echo "Updating local kubelet configuration..."
kubeadm upgrade node
systemctl daemon-reload
systemctl restart kubelet

sleep 3
echo -n "API server reports node version: "; kubectl get node "$NODE_NAME" -o jsonpath='{.status.nodeInfo.kubeletVersion}{"\n"}' || true

echo "Holding Kubernetes packages to prevent unintended upgrades..."
apt-mark hold kubelet kubeadm kubectl

echo "Uncordoning node..."
kubectl uncordon "$NODE_NAME"

echo "Upgrade completed. Current versions:"
echo -n "kubeadm: "; kubeadm version -o short || true
echo -n "kubelet: "; kubelet --version || true
echo -n "kubectl: "; kubectl version --client=true --short || true
echo ""
echo "Final node status:"
kubectl get nodes -o wide


