## 🤔 Kubernetes Scenario Q&A

Real-world Kubernetes troubleshooting and design scenarios with concise explanations.

---

## 1️⃣ Pending Pods Despite Low Node Utilization

**Scenario**  
You have a cluster where several nodes show only **30% CPU/Memory utilization**, yet new Pods are stuck in a **Pending** state with the error `Insufficient CPU`.

**Question**  
Why would the scheduler refuse to place Pods on nodes that appear to have 70% free capacity?

**Answer**  
- Distinguish between **actual usage** (what `top` or Prometheus shows) and **resource requests** (what the **scheduler** uses).  
- If existing Pods have high **Requests** but low actual usage, the scheduler treats that **requested capacity as reserved**, even if it's not currently used.  
- You should also check for:
  - **Pod Affinity / Anti-Affinity** rules  
  - **Taints / Tolerations**  
  These might be silently disqualifying those nodes from being chosen.

---

## 2️⃣ Pods CrashLooping After Traffic Spike

**Scenario**  
You deploy a new version of a **Java microservice**. The **ReadinessProbe** passes, and the service starts receiving traffic. However, after **5 minutes of high load**, the Pods suddenly start restarting in a loop.

**Question**  
If the code hasn't changed its logic, and the **LivenessProbe** is a simple HTTP check, why would a spike in traffic trigger a `CrashLoopBackOff`?

**Answer**  
- Look into the interaction between **Resource Limits** and **Probes**.  
- If the app is **CPU-throttled under load**, the LivenessProbe may **time out** because the app cannot respond in time.  
- Mitigations:
  - Increase `failureThreshold` or `timeoutSeconds` of the probe.  
  - Analyze whether the app's **startup time** has increased; you may need a **StartupProbe** to prevent the LivenessProbe from killing the Pod **before it’s actually ready** under heavy load.

---

## 3️⃣ StatefulSet Pods Failing Due to Volume Affinity

**Scenario**  
You are running a **MongoDB StatefulSet** with three replicas. You need to scale it to five replicas to handle a data surge. However, **Pod-3** and **Pod-4** are stuck in `Pending` with:

> `FailedScheduling: 0/3 nodes are available: 3 node(s) had volume node affinity conflict.`

**Question**  
How can a cluster have plenty of CPU/Memory but still fail to schedule a StatefulSet Pod due to **storage affinity**?

**Answer**  
- This usually happens in **Multi-AZ (Availability Zone)** clusters.  
- The **PersistentVolume (PV)** for `Pod-3` might be **bound to Zone-A**, but the only nodes with free CPU are in **Zone-B**.  
- Kubernetes must schedule the Pod **where the volume lives**, so scheduling fails even though CPU/Memory are available elsewhere.  
- Solution:
  - Use `WaitForFirstConsumer` in your **StorageClass** to ensure the PV is created in the **same zone where the Pod is eventually scheduled**.

---

## 4️⃣ ArgoCD – Configuration Drift & Hotfixes

**Scenario**  
ArgoCD is set to **Auto-Sync**. A developer manually edits a `Deployment` using `kubectl edit`. The manual change is a **critical hotfix**.

**Question**  
What happens to that manual change, and how do you prevent ArgoCD from instantly overwriting it?

**Answer**  
- `kubectl edit` updates the **live Kubernetes object immediately**.  
- ArgoCD detects that **live state ≠ desired state in Git** (configuration drift).  
- With **Auto-Sync enabled**, ArgoCD:
  - **Auto-syncs** the resource back to the Git version.  
  - Your manual hotfix is **reverted** to match Git.  
  - ⏱️ This can happen in **seconds to a couple of minutes**.  
- To preserve the hotfix:
  - In ArgoCD UI: **Application → App Details → Disable Auto-Sync** (temporarily).  
  - Or adjust sync policy / use **manual sync** while you update Git with the hotfix.

---

## 5️⃣ ServiceAccount Accessing Secrets Across Namespaces

**Scenario**  
A security audit finds that a Pod in the **`dev` namespace** was able to **list all Secrets in the `production` namespace**.

The Pod's **ServiceAccount** only has a **RoleBinding** in the `dev` namespace.

**Question**  
How is this possible?

**Answer**  
- Check if the ServiceAccount is bound to a **ClusterRole** via a **ClusterRoleBinding**.  
- Even if the Role is defined locally, a **ClusterRoleBinding**:
  - Grants that permission **across the entire cluster**.  
  - **Ignores namespace boundaries**.  
- So the ServiceAccount may have been accidentally given **cluster-wide permissions**, allowing it to list Secrets in other namespaces, including `production`.

---

*Source: `k8s scenario Q&A.txt` converted to structured markdown.*


