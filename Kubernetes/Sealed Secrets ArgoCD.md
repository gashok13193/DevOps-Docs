# Bitnami Sealed Secrets + ArgoCD Demo

### 1. Create Namespace (optional)

```bash
kubectl create namespace sealed-secrets

```

### 2. Install Sealed Secrets Controller (into `kube-system`, as expected)

```bash
kubectl apply -f https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.26.1/controller.yaml

```

Check pods:

```bash
kubectl get pods -n kube-system | grep sealed-secrets

```

---

### 3. Install `kubeseal` CLI (inside your environment)

```bash
wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.26.1/kubeseal-0.26.1-linux-amd64.tar.gz
tar -xvzf kubeseal-0.26.1-linux-amd64.tar.gz
sudo install -m 755 kubeseal /usr/local/bin/kubeseal

```

---

### 4. Create a Kubernetes Secret

```bash
kubectl create secret generic db-credentials \
  --from-literal=username=admin \
  --from-literal=password=MySecretPass \
  -n default \
  --dry-run=client -o yaml > db-secret.yaml

```

---

### 5. Seal the Secret

```bash
kubeseal --controller-namespace=kube-system --controller-name=sealed-secrets-controller \
  -o yaml < db-secret.yaml > db-sealedsecret.yaml

```

👉 The `db-sealedsecret.yaml` is safe to commit to Git.

Example:

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: db-credentials
  namespace: default
spec:
  encryptedData:
    username: AgC1lPp...==
    password: AgB9sM8...==

```

---

### 6. Apply the Sealed Secret

```bash
kubectl apply -f db-sealedsecret.yaml

```

Controller will create a normal Kubernetes Secret:

```bash
kubectl get secret db-credentials -n default

```