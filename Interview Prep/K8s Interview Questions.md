# Kubernetes Interview Questions

---

## 1. Pod Scheduling Failure in Multi-AZ Cluster

### Question

You have a **3-AZ Kubernetes cluster**. A StatefulSet pod is stuck in `Pending` with this error:

```
0/12 nodes are available: 
3 node(s) had volume node affinity conflict,
5 node(s) didn't match node selector,
4 node(s) had taints.
```

**How would you troubleshoot and fix this?**

**Troubleshooting Steps:**

1. **Check pod events**
   ```bash
   kubectl describe pod <pod-name>
   ```

2. **Check PVC node affinity**
   ```bash
   kubectl describe pv <pv-name>
   ```

3. **Check node labels**
   ```bash
   kubectl get nodes --show-labels
   ```

4. **Check taints**
   ```bash
   kubectl describe node <node>
   ```

**Possible Fixes:**

- Adjust `nodeSelector`
- Add `tolerations`
- Ensure PVC zone matches node zone
- Modify `topologySpreadConstraints`

---

## 2. etcd Failure Scenario

### Question

Your **etcd leader crashes** in a 3-node control plane cluster.
What happens and how does Kubernetes recover?

### Answer

- etcd uses **RAFT consensus**
- Remaining nodes elect a new leader
- Requires **quorum** (2/3 nodes)
- If only 1 node remains:
  - Cluster becomes **read-only**
  - Writes **fail**

**Recovery:**

1. Restore from snapshot:
   ```bash
   etcdctl snapshot restore snapshot.db
   ```
2. Rebuild cluster

---

## 3. HPA Not Scaling Pods

### Question

Your HPA is configured, but pods are **not scaling** even though CPU is high.
What could be wrong?

### Possible Issues

1. **Metrics server missing**
   ```bash
   kubectl top pods
   ```

2. **Wrong resource requests**
   ```
   cpu request = 2 cores
   actual usage = 1 core
   → HPA sees 50% usage, so no scaling.
   ```

3. **Wrong metric type** — `targetAverageUtilization`

4. **Custom metrics misconfiguration**

---

## 4. Kubernetes Networking Deep Question

### Question

How can pods communicate across nodes **without NAT** in Kubernetes?

### Answer

Kubernetes uses **CNI plugins** that implement flat networking.

**Example CNIs:**

| CNI     | Approach        |
|---------|-----------------|
| Calico  | BGP / eBPF      |
| Cilium  | eBPF             |
| Flannel | Overlay network  |

Each pod gets a **unique IP**. Routing happens via:

- Overlay network
- BGP
- eBPF

**Example:**

```
Pod A (Node1) → Pod B (Node2)
Packet routed directly via CNI.
```

---

## 5. Rolling Update Failure

### Question

During a deployment rollout, new pods keep **crashing** and the rollout stops.
How do you debug and rollback safely?

### Answer

1. **Check rollout status:**
   ```bash
   kubectl rollout status deployment app
   ```

2. **Check logs:**
   ```bash
   kubectl logs <pod>
   ```

3. **Rollback:**
   ```bash
   kubectl rollout undo deployment app
   ```

4. **Check revision history:**
   ```bash
   kubectl rollout history deployment app
   ```

---

## 6. Kubernetes Scheduler Internals

### Question

Explain how the Kubernetes scheduler decides where a pod runs.

### Answer

**Scheduling Pipeline:**

| Phase        | Description                                               |
|--------------|-----------------------------------------------------------|
| **Filtering**  | Nodes that satisfy requirements: CPU, Memory, `nodeSelector`, affinity |
| **Scoring**    | Nodes scored by: resource availability, spread, affinity rules         |
| **Binding**    | Scheduler binds pod to the best-scoring node                           |

---

## 7. Pod Eviction Scenario

### Question

A node runs out of memory. **Which pods get killed first?**

### Answer

Based on **QoS (Quality of Service) classes**.

| Priority | QoS Class       | Eviction Order |
|----------|-----------------|----------------|
| 1        | **BestEffort**  | Killed first   |
| 2        | **Burstable**   | Killed second  |
| 3        | **Guaranteed**  | Killed last    |

> **QoS Example:**  
> `Guaranteed` → `requests == limits`

---

## 8. Multi-Cluster Kubernetes Architecture

### Question

You manage **100 Kubernetes clusters** across multiple regions.
How would you manage deployments?

### Expected Answer

Use **GitOps + central control**.

**Tools:**

- ArgoCD
- Flux
- Rancher
- Cluster API

**Architecture:**

```
Git Repo
   ↓
ArgoCD
   ↓
Multiple Clusters
```

---

## 9. Kubernetes Storage Deep Scenario

### Question

A StatefulSet pod cannot start because the PVC is **bound to a different zone**.
Why does this happen?

### Answer

Because of **topology-aware storage**.

**Example:**

```
PV zone  = us-east-1a
Node zone = us-east-1b
→ Kubernetes prevents attach.
```

**Solution:**

- Use `WaitForFirstConsumer` storage class binding mode
- Use topology-aware provisioning

---

## 10. Kubernetes API Server Overload

### Question

Your API server is **overloaded** and `kubectl` commands are slow.
How do you troubleshoot?

### Answer

**Check metrics:**

```bash
kubectl get --raw /metrics
```

**Common Causes:**

- Too many controllers
- High watch traffic
- Poor CRD design

**Solutions:**

- Enable **API Priority & Fairness**
- Reduce polling
- Optimize controllers

---

## 11. Multi-Architecture Docker Images

### Question

How can you build a Docker image that runs on **both AMD64 and ARM64**?

### Answer

Use **Docker Buildx**.

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myrepo/app:latest \
  --push .
```

This creates a **multi-arch manifest**:

```
Image
 ├── AMD64 layer
 └── ARM64 layer
```

Docker automatically pulls the correct one based on the host architecture.

---

## 12. Running Multi-Arch Images in Kubernetes

### Question

You deploy a container image built for `amd64`, but a node runs `arm64`. What happens?

### Answer

Pod will fail with:

```
exec format error
```

**Fix:**

1. Build a multi-arch image
2. Verify with:
   ```bash
   docker manifest inspect <image>
   ```
3. Or restrict scheduling to matching nodes:
   ```yaml
   nodeSelector:
     kubernetes.io/arch: amd64
   ```
