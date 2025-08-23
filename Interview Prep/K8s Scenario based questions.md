## 1. **Pod Scheduling Issue**

**Scenario:** A StatefulSet with 5 replicas on a 3-node cluster, one pod stuck in `Pending`.

**Answer:**

- Check events with `kubectl describe pod <pod>` → likely reason: insufficient resources (CPU/memory) or volume binding issues.
- StatefulSets usually need **PersistentVolumeClaims (PVCs)** per replica. If no matching PV exists in the correct zone/node, the pod won’t schedule.
- Fix: ensure enough PVs with correct `storageClass` and node affinity exist, or expand cluster resources.

---

## 2. **ConfigMap Update**

**Scenario:** ConfigMap updated, but pod still sees old values.

**Answer:**

- Environment variables from ConfigMaps are **only injected at pod startup**.
- That’s why the application still sees old values.
- Fix: either
    - Restart the pods (`kubectl rollout restart deploy <name>`), or
    - Mount ConfigMap as a volume (then file contents update automatically, but not env vars).

---

## 3. **HPA Not Scaling**

**Scenario:** HPA configured but pods don’t scale even with CPU > threshold.

**Answer:**

- Common causes:
    1. **Metrics Server not installed/configured** → HPA can’t read metrics.
    2. Pods have no **CPU requests** set → HPA can’t calculate utilization.
    3. Resource limits set incorrectly → HPA thinks threshold not exceeded.
- Fix: Install metrics-server, define requests/limits, check `kubectl get hpa` for metrics.

---

## 4. **Node Draining Impact**

**Scenario:** Draining a node, some pods stuck in `Terminating`.

**Answer:**

- Causes:
    - Pods **don’t have replicas** (e.g., bare pods or DaemonSets).
    - Pods managed by controllers without proper **PodDisruptionBudgets (PDBs)** → cluster prevents eviction.
    - Finalizers/webhooks blocking pod deletion.
- Fix:
    - Add PDBs to control disruption.
    - Force delete if safe: `kubectl delete pod <pod> --force --grace-period=0`.

---

## 5. **Rolling Update Failure**

**Scenario:** Rolling update caused downtime despite strategy being `RollingUpdate`.

**Answer:**

- Possible reasons:
    - `maxUnavailable` set too high (removing too many pods at once).
    - `readinessProbe` misconfigured → K8s thought pod was ready before actual service availability.
    - App has **long startup time** → traffic routed too early.
- Fix:
    - Set proper readiness/liveness probes.
    - Use conservative rollout config: `maxUnavailable=0`, `maxSurge=1`.
    - Use `kubectl rollout status` to monitor safely.

---

## 6. **Service Discovery Issue**

**Scenario:** Pod cannot resolve DNS of service in the same namespace.

**Answer:**

- Debug:
    - Check if CoreDNS pods are running.
    - Verify `kube-dns`/CoreDNS config (`kubectl logs`).
    - Ensure pod is using correct DNS policy (`dnsPolicy: ClusterFirst`).
    - Check if Service exists in same namespace.
- Fix: Restart CoreDNS if stuck, fix service misconfigurations.

---

## 7. **Pod to External Database Connection**

**Scenario:** Sometimes pods connect to external DB, sometimes fail.

**Answer:**

- Causes:
    - **Network Policies** blocking egress intermittently.
    - DNS resolution issue (external DB hostname not resolving properly).
    - Cloud provider firewall/security group limiting connections.
- Fix:
    - Add proper **NetworkPolicy** rules.
    - Test DNS from pod: `kubectl exec -it <pod> -- nslookup <db-host>`.
    - Whitelist pod/node CIDRs in DB firewall.

---

## 8. **Persistent Volume Binding**

**Scenario:** PVC not bound even though PVs exist.

**Answer:**

- Causes:
    - PV `storageClass` mismatch.
    - Access mode mismatch (e.g., PVC asks `ReadWriteMany`, PV only supports `ReadWriteOnce`).
    - PV has **node affinity/zone restriction** that doesn’t match pod’s scheduling.
- Fix: Align PVC storageClass/access modes, or create PVs in the correct zone.

---

## 9. **Cluster Autoscaler Issue**

**Scenario:** Cluster Autoscaler enabled, but pods stay pending.

**Answer:**

- Causes:
    - Pods have **requests exceeding node size** (can’t fit even in new nodes).
    - Pod has **node affinity/taints** that prevent scheduling on new nodes.
    - Autoscaler has scaling limits (`-max-nodes`, resource quotas).
- Fix: Adjust pod resource requests, check node pools, relax affinity/taints.

---

## 10. **Multi-Namespace Config Drift**

**Scenario:** Same Helm chart deployed in multiple namespaces, but configs differ.

**Answer:**

- Causes:
    - Different **values.yaml** used per namespace.
    - Manual edits (`kubectl edit`) caused drift from Helm’s managed state.
    - Old Helm releases not upgraded properly.
- Fix:
    - Use `helm get values <release>` to check values.
    - Run `helm diff upgrade` to compare.
    - Enforce GitOps with ArgoCD/Flux to prevent drif