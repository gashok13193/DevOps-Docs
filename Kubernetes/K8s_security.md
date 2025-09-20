# 🔐 Kubernetes Security Interview Q&A

### 1. **How do you secure access to the Kubernetes cluster?**

**Answer:**

- **Authentication**: Integrate with OIDC providers (e.g., AWS IAM, Azure AD, Okta) or certificates.
- **Authorization**: Use **RBAC** (Role-Based Access Control) to grant least privilege.
- **Admission Control**: Use **OPA/Gatekeeper** or **Kyverno** to enforce policies (e.g., disallow privileged containers).
- **Audit Logging**: Enable and forward logs to a SIEM system.

---

### 2. **What is RBAC in Kubernetes, and how do you secure it?**

**Answer:**

- RBAC controls **who can do what** inside the cluster.
- Always follow the **principle of least privilege**:
    - Developers → read-only in prod
    - CI/CD → create/update only in dev/staging
- Avoid using `cluster-admin` role except for administrators.
- Example:

```yaml
kind: Role
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  namespace: dev
  name: dev-read-only
rules:
- apiGroups: [""]
  resources: ["pods"]
  verbs: ["get", "list"]

```

---

### 3. **How do you secure secrets in Kubernetes?**

**Answer:**

- By default, Kubernetes stores secrets in **etcd in base64**, which is not encryption.
- Best practices:
    - **Enable Encryption at Rest** for secrets in etcd.
    - Use external secret managers (AWS Secrets Manager, HashiCorp Vault, Sealed Secrets, External Secrets Operator).
    - Apply RBAC to limit access to secrets.
    - Don’t check secrets into Git repos in plain YAML.

---

### 4. **How do you secure pod-to-pod and pod-to-service communication?**

**Answer:**

- **Network Policies** (default deny-all, allow only required traffic):

```yaml
kind: NetworkPolicy
apiVersion: networking.k8s.io/v1
metadata:
  name: allow-frontend-to-backend
  namespace: app
spec:
  podSelector:
    matchLabels:
      role: backend
  ingress:
  - from:
    - podSelector:
        matchLabels:
          role: frontend

```

- Use a **CNI plugin** like Calico or Cilium that supports enforcing policies.
- Enable **mTLS (Mutual TLS)** between services (via Istio/Linkerd).

---

### 5. **What are Pod Security Standards (PSS) or Pod Security Admission (PSA)?**

**Answer:**

- Kubernetes deprecated PodSecurityPolicy (PSP).
- Now we use **Pod Security Admission (PSA)**, enforcing three levels:
    - **Privileged** → unrestricted (not recommended).
    - **Baseline** → prevents known privilege escalations.
    - **Restricted** → strictest (no root, must use non-root user, seccomp enabled).
- Example enforcement:

```bash
kubectl label ns dev pod-security.kubernetes.io/enforce=restricted

```

---

### 6. **How do you prevent containers from running as root in Kubernetes?**

**Answer:**

- Use **securityContext** in PodSpec:

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000

```

- Enforce cluster-wide via **OPA Gatekeeper/Kyverno**.
- Enable **PSA (restricted mode)**.

---

### 7. **How do you secure the Kubernetes API server?**

**Answer:**

- Use **TLS encryption** for all API traffic.
- Enable **API audit logging**.
- Restrict API server access to internal/private networks.
- Limit **anonymous access**.
- Use **API rate limits** to prevent DoS.

---

### 8. **What are common container security tools used with Kubernetes?**

**Answer:**

- **Image Scanning** → Trivy, Clair, Anchore.
- **Runtime Security** → Falco, AppArmor, Seccomp, SELinux.
- **Configuration Scanning** → kube-bench, kube-hunter, Polaris.
- **Policy Enforcement** → OPA Gatekeeper, Kyverno.

---

### 9. **How do you secure images in Kubernetes?**

**Answer:**

- Use a **private registry**.
- Enable **ImagePullSecrets**.
- Use **signed images** (Cosign, Notary).
- Regularly scan images for CVEs (Trivy).
- Avoid `:latest` tags — pin to digest.

---

### 10. **How do you secure etcd in Kubernetes?**

**Answer:**

- Enable **TLS encryption** for client and peer communication.
- Restrict etcd access (API server only).
- Enable **encryption at rest** for secrets.
- Take regular encrypted backups.