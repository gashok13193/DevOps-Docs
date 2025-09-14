# 🎯 **Top 10 ArgoCD Interview Questions & Answers (2025)**

---

### 1️⃣ What is ArgoCD and why do we use it?

**Answer:**

- ArgoCD is a **GitOps-based Continuous Delivery tool** for Kubernetes.
- Instead of pushing deployments (like in Jenkins), it **pulls manifests from Git** and keeps clusters in sync.
- Benefits:
    - Declarative deployments
    - Rollbacks (to Git commit)
    - Multi-cluster support
    - Audit trail (Git history = deployment history)

---

### 2️⃣ How does ArgoCD differ from traditional CI/CD tools like Jenkins?

**Answer:**

- **Jenkins (Push model):** CI pipeline pushes changes into Kubernetes.
- **ArgoCD (Pull model):** ArgoCD continuously monitors Git, pulls changes, and applies them.
- ArgoCD focuses only on **CD (deployment)**, not build/test.
- It ensures clusters always match Git (**source of truth**).

---

### 3️⃣ What are the core components of ArgoCD?

**Answer:**

- **API Server** → Exposes UI/CLI/REST API.
- **Repo Server** → Clones Git repos and generates manifests.
- **Application Controller** → Reconciles desired (Git) vs live (cluster) state.
- **Redis / DB** → Stores app state & cache.

---

### 4️⃣ How does ArgoCD handle multi-cluster deployments?

**Answer:**

- You can register multiple clusters in ArgoCD (`argocd cluster add`).
- Applications can be deployed to **different clusters/namespaces** from a single ArgoCD instance.
- Useful in **multi-environment setups** (dev → staging → prod).

---

### 5️⃣ What are ArgoCD Projects and why are they used?

**Answer:**

- Projects are a **security boundary** for applications.
- They define:
    - Allowed Git repos
    - Allowed clusters/namespaces
    - RBAC policies
- Example: Dev team can only deploy apps from `dev-repo` into `dev namespace`.

---

### 6️⃣ What is the difference between “Sync” and “Auto-Sync” in ArgoCD?

**Answer:**

- **Manual Sync:** User clicks “Sync” to deploy changes from Git.
- **Auto-Sync:** ArgoCD automatically syncs cluster whenever Git changes.
- Auto-sync also supports **self-heal** → if someone manually changes the cluster, ArgoCD reverts it back to Git state.

---

### 7️⃣ How do you implement Canary or Blue-Green deployments with ArgoCD?

**Answer:**

- ArgoCD itself doesn’t do traffic splitting.
- It works with **service mesh/Ingress controllers** (e.g., Istio, NGINX, Linkerd).
- Example:
    - ArgoCD deploys **v1 and v2** of an app.
    - Istio VirtualService splits traffic 90/10 → Canary deployment.
    - Switching service selector instantly → Blue-Green.

---

### 8️⃣ How does ArgoCD handle secrets?

**Answer:**

- By default, Kubernetes Secrets are stored in plaintext (Base64).
- Common integrations:
    - **SealedSecrets (Bitnami)**
    - **External Secrets Operator**
    - **HashiCorp Vault Plugin**
- Best practice → never keep plain secrets in Git.

---

### 9️⃣ How does RBAC work in ArgoCD?

**Answer:**

- Configured in `argocd-rbac-cm` ConfigMap.
- Users/Groups mapped to roles (`role:admin`, `role:readonly`, or custom).
- Example:
    
    ```yaml
    p, role:dev, applications, sync, dev/*, allow
    
    ```
    
    → Devs can sync only apps in `dev` project.
    
- Login options: local users, SSO (OIDC, LDAP).

---

### 🔟 Common ArgoCD Issues and How to Fix Them?

**Answer:**

1. **App stuck in OutOfSync:**
    - Check repo path & manifests.
2. **InvalidSpecError:**
    - Repo/cluster not allowed in project.
3. **Permissions denied:**
    - RBAC misconfigured.
4. **Segmentation fault in CLI:**
    - Version mismatch between CLI and ArgoCD server.