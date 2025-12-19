# 🚀 Kubernetes 1.35 ("Timbernetes") — What You Need to Know

Kubernetes 1.35 brings game-changing features: **in-place pod resource updates**, **native pod certificates**, **better scheduling**, and **enhanced security**. Plus, some important deprecations you need to prepare for.

---

## ✅ Major Features (GA / Beta)

### Feature 1️⃣: In-Place Update of Pod Resources (GA)

Enables modifying **CPU & memory for running Pods** without restarts.

> 🎯 **Why it matters:** Removes the need to delete/recreate pods for resource adjustment, reducing downtime for stateful apps.

**Benefits:**

- Smoother and quicker vertical scaling
- Zero downtime resource adjustments
- Perfect for stateful applications

---

### Feature 2️⃣: Node Declared Features (Alpha)

Nodes can now declare exactly what features they support in `.status.declaredFeatures`.

**How it works:**

- Scheduler and admission controllers use this for **safe placement decisions**
- Helps in clusters with **version skew** (control plane vs nodes)

> 🧠 This improves scheduling reliability when your cluster has mixed node versions.

---

### Feature 3️⃣: Pod Certificates (Beta)

Kubernetes can now **natively issue short-lived TLS certificates** to Pods.

**What this means:**

- Simplifies workload identity and mutual TLS (mTLS) without external tools
- Built-in workload identity capability
- No need for external cert managers for basic use cases

> 🔐 **Security boost:** Native pod-to-pod encryption without third-party tools.

---

### Feature 4️⃣: Numeric Values for Taints

New toleration operators like `Gt` / `Lt` allow **numeric thresholds** (e.g., SLA >950).

**Example use case:**

```yaml
tolerations:
- key: "sla"
  operator: "Gt"
  value: "950"
```

> 🎯 This gives more **nuanced scheduling decisions** than exact matches.

---

### Feature 5️⃣: User Namespaces (Beta by Default)

Containers' root (UID0) can be **remapped to unprivileged hosts UIDs**.

**Security improvements:**

- Isolates container users from host root
- Previously in Beta; **now enabled by default**

> 🥷 **Better security:** Prevents container root from accessing host root files.

---

## 🧪 Alpha / Beta Features

### Gang Scheduling (Alpha)

Enables **all-or-nothing scheduling** for multi-Pod workloads (e.g., distributed ML jobs).

**What it does:**

- Can block until all pods can be scheduled together
- Critical for workloads that need all-or-nothing placement

> 👉 **Perfect for:** AI/ML & HPC workloads where partial scheduling breaks functionality.

---

### Opportunistic Batching (Beta)

Scheduler can **batch similar pods** for faster placement.

> ⚡ **Great for:** Large-scale jobs where batching improves efficiency.

---

### Constrained Impersonation (Alpha)

Limits impersonation permissions: a user **can't gain more rights than they already have**.

> 🤝 **Tightens RBAC safety:** Prevents privilege escalation through impersonation.

---

### Image Pull Credential Verification (Beta)

Ensures image registry credentials are **re-verified even for cached images**.

> 🔐 **Security improvement:** Better security for multi-tenant clusters.

---

## ❌ Deprecations & Removals

### 🚫 Deprecate kube-proxy IPVS Mode

**IPVS mode is being removed** due to complexity.

> ⚠️ **Action required:** Switch to **nftables** as the recommended backend.

---

### 🛑 Final Warning for containerd 1.x

**Kubernetes 1.35 is the last release supporting containerd 1.x.**

> 🔥 **Critical:** Switch to **containerd 2.x** before upgrading to future versions.

---

### 🧨 cgroup v1 Disabled by Default

Kubernetes now **disables cgroup v1 by default**, requiring **cgroup v2 on nodes**.

**What you must do:**

- Ensure nodes run Linux with cgroup v2
- Verify your Linux distribution supports cgroup v2

> ⚠️ **Migration required:** Check your nodes before upgrading.

---

## 🔒 Security Improvements

### Harden Kubelet Certificate CN Validation (Alpha)

New validation requiring kubelet cert CN equals `system:node:<nodename>`.

> 🔐 **Prevents:** Certain impersonation attacks through certificate validation.

---

## 📊 Feature Status Summary

| Feature | Status | What it Means |
|---------|--------|---------------|
| **In-Place Pod Update** | **Stable (GA)** | No restarts for resizing |
| **Pod Certificates** | **Beta** | Native workload certs |
| **Node Declared Features** | **Alpha** | Better scheduling decisions |
| **Gang Scheduling** | **Alpha** | For all-or-nothing multi-Pod jobs |
| **Numeric Taints** | **Alpha/Beta** | Threshold-based scheduling |
| **cgroup v1** | **Removed/Disabled** | Must use cgroup v2 |
| **containerd 1.x support** | **End** | Upgrade to 2.x |

---

## 🎯 Key Takeaways

1. **In-place pod updates** are now stable — use them for zero-downtime scaling
2. **Pod certificates** eliminate the need for external cert managers in many cases
3. **Action required:** Upgrade containerd to 2.x and ensure cgroup v2 support
4. **Gang scheduling** is coming for AI/ML workloads — keep an eye on it

> 🚀 Kubernetes 1.35 brings production-ready features that simplify operations and improve security.

