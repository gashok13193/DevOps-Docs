# Cilium For Kubernetes

Kubernetes networking traditionally relied on iptables-based CNIs (Calico, Flannel, Weave).
But they struggled with performance, scalability, and deep security visibility.

## Why Cilium Exists

- ✔ High performance (because of eBPF — kernel-level packet processing)
- ✔ Built-in observability
- ✔ Network security + policies + service mesh
- ✔ Strategic replacement for service mesh & sidecars

Cilium is an eBPF-powered Kubernetes networking & security platform
that replaces traditional CNIs and even Istio-like service meshes.

## 1) What is eBPF?

eBPF lets you run programmable networking logic inside the Linux kernel
without writing kernel modules.

## 2) Cilium is not just networking, it gives:

- ✔ CNI (Pod connectivity)
- ✔ Network policies (zero trust)
- ✔ Load balancing (replacement of kube-proxy)
- ✔ Hubble (deep observability)
- ✔ Cilium Mesh (service mesh without sidecars)
- ✔ Gateway API support (ingress/egress control)

---

## PART 1 — Cleanup

### Step 1: Remove existing Cilium

```bash
cilium uninstall
```

### Step 2: Reset Minikube networking

```bash
minikube delete --all
```

### Step 3: Start a clean Minikube

```bash
minikube start --memory=4096 --cpus=4
```

---

## PART 2 — Install Cilium properly

### Step 1: Install Cilium CLI

```bash
curl -L --remote-name https://github.com/cilium/cilium-cli/releases/latest/download/cilium-linux-amd64.tar.gz
sudo tar -xvf cilium-linux-amd64.tar.gz -C /usr/local/bin
cilium version
```

### Step 2: Deploy Cilium CNI

```bash
cilium install
```

### Step 3: Verify installation

```bash
cilium status
```

---

## PART 3 — Enable Observability with Hubble

```bash
cilium hubble enable --ui
```

### Start UI:

```bash
kubectl -n kube-system port-forward svc/hubble-ui 12000:80
```

---

## PART 4 — Deploy demo application for policy demos

### Step 1: Create namespace

```bash
kubectl create ns demo
```

### Step 2: Deploy backend

```bash
kubectl -n demo create deployment backend --image=nginx
kubectl -n demo expose deployment backend --port=80 --name=backend-svc
```

### Step 3: Deploy frontend pod

```bash
kubectl -n demo create deployment frontend --image=busybox -- sleep 3600
kubectl -n demo expose deployment frontend --port=80 --name=frontend-svc
```

### Step 4: Label pods (important)

```bash
kubectl -n demo label deploy/frontend app=frontend --overwrite
kubectl -n demo label deploy/backend app=backend --overwrite
```

### Step 5: Test baseline connectivity

```bash
kubectl -n demo exec -it deploy/frontend -- wget -qO- http://backend-svc
```

---

## PART 5 — Introducing Network Policies

### Deny frontend → backend traffic

**deny-egress.yaml**

```yaml
apiVersion: cilium.io/v2
kind: CiliumNetworkPolicy
metadata:
  name: deny-frontend-to-backend
  namespace: demo
spec:
  endpointSelector:
    matchLabels:
      app: frontend
  egressDeny:
  - toEndpoints:
    - matchLabels:
        app: backend
```

```bash
kubectl apply -f deny-egress.yaml
```

### Test:

```bash
kubectl -n demo exec -it deploy/frontend -- wget -qO- --timeout=3 http://backend-svc || echo "Denied!"
```

