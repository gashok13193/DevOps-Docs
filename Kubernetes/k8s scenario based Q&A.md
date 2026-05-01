

### **1. Control Plane & State Management (etcd)**

**Question:** An etcd cluster of 5 nodes loses 3 nodes simultaneously due to a network partition. What is the immediate state of the Kubernetes cluster, and what specific steps must you take to recover it?

**Answer:** 
The Kubernetes control plane will immediately become read-only. An etcd cluster of 5 nodes requires a quorum of 3 nodes to process writes. With only 2 nodes remaining, quorum is lost. 
*   **Cluster State:** Existing workloads (Pods) will continue to run, and the network (via `kube-proxy` and CNI) will continue to route traffic. However, you cannot deploy new workloads, autoscale, or update states. Even if a node dies, the scheduler cannot replace its pods.
*   **Recovery:** You cannot simply wait for the 3 nodes to come back if they are permanently destroyed. You must force a cluster recovery:
    1. Stop the Kubernetes API server on all control plane nodes to prevent transient writes.
    2. Pick one of the surviving etcd nodes and take a snapshot of its data using `etcdctl snapshot save`.
    3. Restore the snapshot using `etcdctl snapshot restore` to initialize a brand-new, single-node etcd cluster.
    4. Start the API server connected to this single node.
    5. Dynamically add new etcd members to scale the cluster back to 3 or 5 nodes to establish a new quorum.

---

### **2. Networking & Scalability**

**Question:** What is the fundamental difference in how `kube-proxy` processes network traffic when configured in `iptables` mode versus `IPVS` mode, and why does this matter for a cluster with 10,000 Services?

**Answer:**
The difference lies in the underlying Linux kernel data structures used to route packets.
*   **`iptables` Mode:** Kube-proxy creates a sequential chain of rules for every Service and endpoint. When a packet arrives, the kernel evaluates these rules linearly. The time complexity for a lookup is $O(n)$. In a cluster with 10,000 Services, this linear evaluation creates massive CPU overhead and high network latency. Additionally, updating the rules requires rewriting the entire iptables chain, which is agonizingly slow.
*   **`IPVS` Mode (IP Virtual Server):** IPVS uses a hash table to store routing rules. The time complexity for a lookup is $O(1)$, meaning routing performance remains constant whether you have 10 Services or 10,000. IPVS also supports more advanced load-balancing algorithms (like least connections or locality-based) compared to the simple random selection in `iptables`.

---

### **3. Advanced Scheduling & Storage Binding**

**Question:** You need to deploy a highly available Database StatefulSet. You want the Pods spread across three Availability Zones (AZs) for resilience, but they must *only* land on nodes containing a specific GPU. How do you architect the scheduling and storage provisioning to prevent PVC binding deadlocks?

**Answer:**
This requires coordinating Pod scheduling constraints with persistent volume provisioning.
*   **Scheduling:** Use `topologySpreadConstraints` (key: `topology.kubernetes.io/zone`) to ensure the Pods are evenly distributed across the 3 AZs. Combine this with a `nodeSelector` or `nodeAffinity` targeting the GPU label (e.g., `accelerator: nvidia-tesla-v100`).
*   **Storage Deadlock Prevention:** The critical piece is the `StorageClass`. You must set `volumeBindingMode: WaitForFirstConsumer`. 
*   **Why?** If you use the default `Immediate` binding mode, the cloud provider might instantly provision a Persistent Volume (PV) in AZ-1 as soon as the PVC is created. However, the scheduler might decide (due to the topology spread and GPU availability) that the Pod must run in AZ-2. The Pod will permanently hang in a `Pending` state because it cannot attach the AZ-1 volume to an AZ-2 node. `WaitForFirstConsumer` forces the volume provisioner to wait until the Pod is actually scheduled onto a node before creating the disk in the correct zone.

---

### **4. API Extensibility & Versioning**

**Question:** You have written a Custom Resource Definition (CRD) and an Operator. You are upgrading the CRD schema from `v1alpha1` to `v1`. How does Kubernetes ensure that clients requesting `v1` can read objects originally created as `v1alpha1`, and how do you permanently update the data resting in etcd?

**Answer:**
This involves dynamic translation via Webhooks and manual state migration.
*   **Dynamic Translation:** You must write and deploy a **Conversion Webhook**. In your CRD manifest, you configure the `conversion` block to point to this webhook. When a user creates a `v1alpha1` object, it is stored in etcd. Later, if a user runs `kubectl get <resource> -o yaml` requesting the `v1` API, the API Server fetches the `v1alpha1` object from etcd, sends it to your Conversion Webhook, translates it in-memory to `v1`, and returns it to the user.
*   **Migrating etcd Data:** The Conversion Webhook does *not* automatically rewrite the existing data inside etcd. To permanently migrate the stored data from `v1alpha1` to `v1`, you must use the Kubernetes Storage Version Migration tool (or write a script) that reads every single custom resource and simply writes it back. The API server will then save it using the new designated storage version.

---

### **5. Security & Admission Control**

**Question:** You want to enforce a security policy where every Pod deployed to the `production` namespace is automatically injected with a sidecar proxy. However, you must also guarantee that no container in that Pod (including the sidecar) runs as `root`. How do you sequence this using Kubernetes Admission Controllers?

**Answer:**
You must rely on the exact execution order of the API Server's admission phases: **Mutating** then **Validating**.
1.  **Mutating Admission Webhook:** First, you deploy a Mutating Webhook configured to watch Pod creations in the `production` namespace. When an API request comes in, this webhook intercepts it, checks if the sidecar is present, and if not, patches the JSON payload to inject the proxy container. 
2.  **Validating Admission Webhook:** Next, you use a Validating Webhook (or a policy engine like OPA Gatekeeper/Kyverno). Because the Mutating phase always runs *before* the Validating phase, the Validating webhook will evaluate the final, mutated Pod spec. It will inspect the `securityContext` of every container (the original app and the newly injected sidecar) to ensure `runAsNonRoot: true` is explicitly set. If it is missing, it rejects the entire API request.