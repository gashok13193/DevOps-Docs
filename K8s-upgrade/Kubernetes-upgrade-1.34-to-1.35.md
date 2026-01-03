# Kubernetes Upgrade v1.34 → v1.35 using kubeadm

## 🧱 Cluster Setup

I'm using a kubeadm-based cluster with:

- 1 control plane node
- 1 worker node
- Ubuntu OS

This is the most common real-world setup.

```bash
kubectl get nodes
```

## 🧠 Core Concept

Upgrading Kubernetes is **NOT** just upgrading kubelet binaries.  
kubeadm is the source of truth for cluster state.  
If kubeadm upgrade is skipped, nodes will break.

| Component | Role                       |
| --------- | -------------------------- |
| kubeadm   | Cluster lifecycle & config |
| kubelet   | Node agent                 |
| kubectl   | CLI                        |

---

## 🔺 CONTROL PLANE UPGRADE

### Step 1️⃣: Upgrade kubeadm (Control Plane)

```bash
sudo apt-get update
sudo apt-get install -y kubeadm=1.35.0-1.1
```

**Verify:**

```bash
kubeadm version
```

> **Important:** "kubeadm must always be upgraded first."

### Step 2️⃣: Apply Kubernetes Upgrade

```bash
sudo kubeadm upgrade apply v1.35.0
```

**What happens during this step:**

- API server upgrade
- etcd compatibility check
- CoreDNS & kube-proxy upgrade

> **🎙️ Important:** "This upgrades the cluster, NOT the node binaries yet."

### Step 3️⃣: Upgrade kubelet & kubectl

```bash
sudo apt-get install -y kubelet=1.35.0-1.1 kubectl=1.35.0-1.1
```

**Restart services:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

**Verify:**

```bash
kubectl get nodes
```

**Expected output:**

- Control plane → v1.35.0
- Worker still → v1.34.3

---

## 🔻 WORKER NODE UPGRADE

### Step 4️⃣: Drain Worker Node (from control plane)

```bash
kubectl drain node01 --ignore-daemonsets --force
```

> **🎙️ Note:** "Drain safely evicts workloads before touching the node."

**Important Mention:**

- `--delete-local-data` is deprecated → normal error (can be ignored)

### Step 5️⃣: Configure Kubernetes v1.35 Repo (Worker Node)

```bash
sudo mkdir -p /etc/apt/keyrings

curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.35/deb/Release.key \
  | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg

echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] \
https://pkgs.k8s.io/core:/stable:/v1.35/deb/ /" \
  | sudo tee /etc/apt/sources.list.d/kubernetes.list

sudo apt-get update
```

### Step 6️⃣: Upgrade kubeadm (Worker)

```bash
sudo apt-get install -y kubeadm=1.35.0-1.1
```

**Verify:**

```bash
kubeadm version
```

### 🔥 Step 7️⃣: Upgrade Node Configuration (THE MOST MISSED STEP)

```bash
sudo kubeadm upgrade node
```

> **Critical:** "This command is what actually upgrades the node configuration. Without this, kubelet version alone is useless."

**What this step does:**

- Regenerates kubelet config
- Fixes kubeadm flags
- Aligns certificates

### Step 8️⃣: Upgrade kubelet & kubectl

```bash
sudo apt-get install -y kubelet=1.35.0-1.1 kubectl=1.35.0-1.1
```

**Restart services:**

```bash
sudo systemctl daemon-reload
sudo systemctl restart kubelet
```

**Verify:**

```bash
kubelet --version
```

### Step 9️⃣: Uncordon Node

**From control plane:**

```bash
kubectl uncordon node01
kubectl get nodes
```

**🎯 Expected output:**

```
NAME          STATUS   VERSION
controlplane  Ready    v1.35.0
node01        Ready    v1.35.0
```

---

## 🚨 REAL ERRORS FACED

### ❌ Error 1: Repo not found

**Error:**
```
404 Not Found kubernetes-xenial
```

**✔ Fix:**

- `apt.kubernetes.io` is deprecated
- Use `pkgs.k8s.io` instead

### ❌ Error 2: kubeadm-flags.env missing

**Error:**
```
no flags found in kubeadm-flags.env
```

**✔ Fix:**

Run `kubeadm upgrade node` (Step 7️⃣)

---

## 🧠 Final Summary

> "Kubernetes upgrade is predictable if you respect the order:  
> kubeadm → control plane → kubelet → worker nodes.  
> 
> Most production outages happen when people skip `kubeadm upgrade node`."

---

## 📌 One-Slide Cheat Sheet

### Control Plane:
```
kubeadm → kubeadm upgrade apply → kubelet
```

### Worker:
```
Drain → kubeadm → kubeadm upgrade node → kubelet → Uncordon
```

