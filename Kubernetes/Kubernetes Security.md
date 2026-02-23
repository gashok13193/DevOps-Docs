## Kubernetes Security – What 90% of Engineers Ignore

### Why Most Clusters Are Insecure

90% of Kubernetes clusters are insecure — **not** because Kubernetes itself is insecure, but because engineers ignore four critical security areas:

- **RBAC (Role-Based Access Control)**
- **Pod security (privileges / users)**
- **Network policies**
- **Secrets management**

The sections below walk through live-style demos of common misconfigurations and how to fix them.

---

### Demo 1 – RBAC Misconfiguration

#### Problem: Over-Privileged ClusterRole

A common anti-pattern is creating a `ClusterRole` with full access to everything:

Create `danger-role.yaml`:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: full-access
rules:
- apiGroups: ["*"]
  resources: ["*"]
  verbs: ["*"]
```

Apply it:

```bash
kubectl apply -f danger-role.yaml
```

#### Problem: Binding to Default Service Account

Binding this role to the default service account gives any pod in the namespace full cluster access:

```bash
kubectl create clusterrolebinding bad-binding \
  --clusterrole=full-access \
  --serviceaccount=default:default
```

Now deploy a pod using that service account:

```bash
kubectl run attacker \
  --image=bitnami/kubectl \
  --command -- /bin/sh -c "sleep 3600"

kubectl get pods
kubectl exec -it attacker -- sh
kubectl get secrets -A
```

From inside the pod you can list **all secrets in all namespaces**.

#### Fix: RBAC Best Practices

```bash
kubectl delete clusterrolebinding bad-binding
```

- **Never bind `cluster-admin` or full-access roles** to default or broadly used service accounts.
- **Prefer namespace-scoped `Role` + `RoleBinding`** over cluster-wide roles.
- **Use least privilege**: limit `apiGroups`, `resources`, and `verbs` to only what is truly required.

---

### Demo 2 – Pods Running as Root

#### Problem: Root User in Containers

By default, many images run as `root`. That increases container breakout and privilege escalation risk.

Deploy a pod that runs as root:

```bash
kubectl run root-pod --image=nginx
kubectl exec -it root-pod -- bash

whoami
```

You will typically see:

```bash
root
```

#### Fix: Use Security Context

Create `secure-pod.yaml`:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-pod
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
  containers:
  - name: nginx
    image: nginx
    securityContext:
      allowPrivilegeEscalation: false
```

Key controls:

- **`runAsNonRoot: true`** – ensures the container user is non-root.
- **`runAsUser: 1000`** – runs the container as an unprivileged UID.
- **`allowPrivilegeEscalation: false`** – prevents gaining additional privileges via setuid binaries, etc.

Also:

- **Use non-root base images** whenever possible.
- Enforce these policies via **Pod Security Standards** and/or admission controllers.

---

### Demo 3 – No Network Policies

#### Problem: Flat Network – All Pods Can Talk

By default, Kubernetes allows **all** pod-to-pod communication within a cluster (assuming a CNI that supports NetworkPolicy but none are defined).

Create a simple backend and an attacker pod:

```bash
kubectl run backend --image=nginx
kubectl run attacker2 --image=busybox -- sleep 3600
```

Expose the backend:

```bash
kubectl expose pod backend \
  --port=80 \
  --name=backend-service

kubectl get svc
```

From the attacker pod:

```bash
kubectl exec -it attacker2 -- sh
wget -qO- backend-service
```

The request succeeds — there is **no isolation**.

#### Fix: Apply a Deny-By-Default NetworkPolicy

Create `deny-all.yaml`:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
```

Apply it:

```bash
kubectl apply -f deny-all.yaml
```

Now new incoming connections are blocked unless explicitly allowed:

- **🚫 Unintended pod-to-pod communication is blocked.**
- Build on this with **allow-only** policies for specific apps and namespaces.

This is the foundation of **Zero Trust networking in Kubernetes**.

---

### Demo 4 – Exposed Secrets

#### Problem: Base64 ≠ Encryption

Create a secret:

```bash
kubectl create secret generic db-secret \
  --from-literal=password=SuperSecret123
```

View it:

```bash
kubectl get secret db-secret -o yaml
```

The secret value is only **base64-encoded**, not encrypted.

Decode manually:

```bash
echo U3VwZXJTZWNyZXQxMjM= | base64 -d
```

Output:

```text
SuperSecret123
```

Kubernetes secrets are **not encrypted at rest by default** in etcd.

#### Fix: Hardening Secrets

- **Enable etcd encryption at rest** in the API server configuration.
- Use external secret management solutions:
  - **Sealed Secrets**
  - **HashiCorp Vault**
  - **External Secrets Operator**
- Restrict access to secrets via **RBAC** and **NetworkPolicy**.

---

### Kubernetes Security Building Blocks

- **RBAC** → Controls who/what can call the Kubernetes API.
- **NetworkPolicy** → Controls which pods and CIDRs can talk to each other.
- **SecurityContext / Pod Security** → Controls container privileges and Linux user/FS controls.
- **Secrets** → Protect sensitive data like passwords, tokens, and keys.

If your Kubernetes cluster does **not** have:

- RBAC properly configured (no broad `cluster-admin` bindings)
- Non-root containers and strict `securityContext`
- Network policies enforcing least-privilege connectivity
- Secret encryption at rest
- Image scanning in your CI/CD
- Admission controllers enforcing security policies

…then your cluster is likely **vulnerable**.

---

### Recommended Tools

- **Falco** – Runtime security and anomaly detection.
- **Kyverno / OPA Gatekeeper** – Policy-as-code and admission control.
- **Trivy** – Image, filesystem, and configuration vulnerability scanning.
- **kube-bench** – CIS Kubernetes benchmark checks.

Use these tools together with the practices above to continuously validate and harden your Kubernetes clusters.
