#                                                       DEVOPS ARCHITECTURE FOR PRODUCTION

## 0 — Prerequisites 

**What to have ready:**

Cloud account (AWS/GCP/Azure) or on-prem infra. Decide managed (EKS/GKE/AKS) vs self-hosted (kubeadm/kubespray). Recommendation: managed (EKS/GKE/AKS) for production unless you need full control.

Terraform / Cloud CLI installed. kubectl, helm, jq, and a Git repo (GitHub/GitLab).

An SRE/Platform runbook document and owner for the cluster.


## 1 — Set up foundational networking & IAM (VPC / subnets / routes / NAT / security groups / roles)

**What:** VPC with 3 AZ subnets (private for nodes), public LB subnets, NAT gateway, route tables; IAM roles for cluster and node pools.
**Why:** Multi-AZ networking is the foundation — ensures availability and correct security boundaries. IAM roles give least-privilege automation for node/cluster actions.

**How (example: Terraform / AWS):**

  Terraform VPC module to create:

  3 private subnets (one per AZ)

  3 public subnets (for LBs)

  NAT gateway(s) or NAT gateway per AZ for high availability

  Create IAM roles: eks-cluster-role, eks-node-role with least privilege policies.

**Verify:**

Confirm 3 AZs are available and subnets are created. aws ec2 describe-subnets --filters ...

Show topology diagram or terraform show.

**Pitfalls & fixes:**

Wrong route tables → nodes cannot reach internet for image pulls. Fix: check route table associations.

Missing IAM policies → cluster creation fails. Fix: attach required managed policies.


## 2 — Provision the Kubernetes control plane (managed or self-hosted) and bootstrap cluster

**What:** Create cluster (EKS/GKE/AKS or kubeadm). Create initial admin kubeconfig.

**Why:** Cluster is the central control plane. Managed control planes are recommended for production (automated upgrades, HA, etc.)

**How:**

EKS (eksctl quick example):

```bash
eksctl create cluster --name prod-cluster \
  --region us-east-1 \
  --zones us-east-1a,us-east-1b,us-east-1c \
  --nodegroup-name ng-general --node-type m5.large --nodes 3
```

Or Terraform aws_eks_cluster module for IaC.

**Verify:**

```bash
kubectl get nodes
kubectl get cs # componentstatuses
kubectl get pods -n kube-system
```

**Pitfalls & fixes:**

Control plane subnet in public vs private causing security issues — ensure control plane subnets are private.

API server role error — fix IAM trust relationship.


## 3 — Create Node Pools / Node Groups (general, spot/preemptible, GPU, storage-optimized)

**What:** Multiple node pools with labels & taints:

- node-role=general (on-demand)
- node-role=spot (spot/preemptible, with tolerations)
- node-role=gpu (GPU workloads, with GPU drivers)
- node-role=storage (high-IO)

**Why:** Separation of workload types and cost optimization. Taints + tolerations enforce placement.

**How:**

For EKS: create additional nodegroups with eksctl or Terraform aws_eks_node_group.

Add labels/taints in nodegroup spec, e.g., `--node-labels node-role=general` or via AWS tags.

**Verify:**

```bash
kubectl get nodes --show-labels
kubectl describe node <node> # check taints
```

**Pitfalls & fixes:**

GPU driver missing → GPU pods stuck. Install NVIDIA device plugin daemonset.

Spot nodes evicted unexpectedly — ensure workloads tolerate interruption.


## 4 — Install CNI & baseline Network Policies (Calico or Cilium)

**What:** CNI plugin + default deny network policies (baseline allow rules).

**Why:** Provides pod networking, network policy enforcement, and optional eBPF observability (Cilium).

**How:**

Install Cilium (example Helm):

```bash
helm repo add cilium https://helm.cilium.io/
helm repo update
helm install cilium cilium/cilium --namespace kube-system
```

Apply a default deny policy:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny
  namespace: default
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

**Verify:**

```bash
kubectl get pods -n kube-system # cilium/calico pods running
# Test connection between pods using kubectl exec (should be blocked until allow rules added).
```

**Pitfalls & fixes:**

CNI conflicting with cloud-provided CNI — pick one and follow provider docs.

Default deny breaks control plane connections — ensure necessary allow policies for kube-dns, kubelet.


## 5 — Install cert-manager (automated TLS)

**What:** cert-manager with ClusterIssuer (ACME/LetsEncrypt or internal CA).

**Why:** Auto-issue and renew TLS certs for Ingress and services.

**How:**

```bash
kubectl create namespace cert-manager
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm install cert-manager jetstack/cert-manager \
  --namespace cert-manager --set installCRDs=true
```

Create ClusterIssuer (Let's Encrypt staging for demo, production for real):

```yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-staging
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: ops@example.com
    privateKeySecretRef:
      name: acme-private-key
    solvers:
    - http01:
        ingress:
          class: nginx
```

**Verify:**

```bash
kubectl get pods -n cert-manager
# Create an Ingress with cert-manager.io/cluster-issuer: "letsencrypt-staging" and check certificate object.
```

**Pitfalls & fixes:**

Rate limits with Let's Encrypt production — use staging for testing.

Missing ingress class mismatch — use correct ingressClassName.


## 6 — Install Ingress Controller (nginx / cloud LB) and expose an example app

**What:** NGINX ingress controller or cloud-provider LB with Ingress support.

**Why:** Entry point for HTTP(S) traffic into the cluster with host/path routing and TLS termination.

**How:**

```bash
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx -n ingress-nginx --create-namespace
```

Example Ingress:

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: demo-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-staging
spec:
  rules:
  - host: demo.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: demo-svc
            port:
              number: 80
  tls:
  - hosts:
    - demo.example.com
    secretName: demo-tls
```

**Verify:**

```bash
kubectl get svc -n ingress-nginx # external IP
curl http://<external-ip-or-host>
```

**Pitfalls & fixes:**

Ingress controller pending external IP — attach correct cloud LB permissions.

Host DNS not pointing to LB — use test host entry for demo.


## 7 — Install GitOps (ArgoCD) & connect to Git

**What:** ArgoCD for declarative continuous delivery (App-of-Apps pattern recommended).

**Why:** Provides auditable, automated deployments from Git; rollback & promotion are easy.

**How:**

```bash
kubectl create ns argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl port-forward svc/argocd-server -n argocd 8080:443
# Login: admin password in secret argocd-initial-admin-secret
```

Create Argo App referencing Git repo:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: demo-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: 'https://github.com/your-org/infra.git'
    path: 'apps/demo'
    targetRevision: HEAD
  destination:
    server: 'https://kubernetes.default.svc'
    namespace: demo
  syncPolicy:
    automated: {}
```

**Verify:**

```bash
# ArgoCD UI shows apps and sync status.
kubectl get apps -n argocd
```

**Pitfalls & fixes:**

RBAC misconfiguration — ensure Argo has permissions for target namespaces.

Secret management — do not store plain secrets in Git.


## 8 — Install Observability: Prometheus (metrics) + Grafana + Alertmanager

**What:** kube-prometheus-stack (Prometheus Operator) and Grafana.

**Why:** Collect node / pod / app metrics, create dashboards and alerts (SLOs).

**How:**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install monitoring prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

**Verify:**

```bash
kubectl port-forward svc/prometheus-kube-prometheus-prometheus -n monitoring 9090:9090
# Visit Prometheus UI; run basic query up or kube_pod_info.
```

**Pitfalls & fixes:**

High cardinality metrics → performance issues. Use relabeling to drop noisy labels.

Storage retention too small — configure remote-write to long-term storage.


## 9 — Install Log Collection: FluentBit / Vector → central log store (Splunk/ELK)

**What:** Daemonset forwarder to ship logs to Splunk HEC / Elasticsearch / Logstash.

**Why:** Centralized logs for incident response and auditing.

**How (FluentBit example):**

```bash
helm repo add fluent https://fluent.github.io/helm-charts
helm repo update
helm install fluent-bit fluent/fluent-bit -n logging --create-namespace \
  --set backend.type=http --set backend.http.host=<SPLUNK_HEC_HOST> --set backend.http.port=8088 \
  --set backend.http.tls=true --set backend.http.auth_token=<HEC_TOKEN>
```

**Verify:**

```bash
kubectl get pods -n logging
# Check Splunk or ELK for received logs (search index=main | head 10)
```

**Pitfalls & fixes:**

Lack of parsing → unstructured logs. Use parsers and structured JSON logging at app level.

Log volume costs — configure sampling or tail only necessary logs.


## 10 — Deploy Service Mesh (Linkerd or Istio) — phased rollout

**What:** Install Linkerd (simpler) or Istio (full-featured) and enable sidecar injection selectively.

**Why:** Provides mTLS, telemetry, traffic shaping (canary), retries, circuit breaking.

**How (Linkerd quickstart):**

```bash
curl -sL https://run.linkerd.io/install | sh
linkerd install | kubectl apply -f -
linkerd check
# Add annotation to namespace to auto-inject
kubectl annotate namespace demo linkerd.io/inject=enabled
```

**Verify:**

```bash
linkerd viz install # for viz components
linkerd check
kubectl get pods -n linkerd
```

**Pitfalls & fixes:**

Increased resource usage by sidecars — monitor resource overhead.

Complex policies in Istio — roll out gradually.


## 11 — Deploy Stateful Systems via Operators (Strimzi for Kafka, Postgres operator)

**What:** Operators (like Strimzi) manage StatefulSets, PVCs, and scaling for data platforms.

**Why:** Operators encode best practices and automate lifecycle for complex stateful systems.

**How (Strimzi quick):**

```bash
kubectl create ns kafka
kubectl apply -f 'https://strimzi.io/install/latest?namespace=kafka' -n kafka
# create Kafka cluster using Strimzi Kafka CR
kubectl apply -f kafka-cluster.yaml -n kafka
```

`kafka-cluster.yaml` contains broker count, storage class, and listeners.

**Verify:**

```bash
kubectl get kafka -n kafka
kubectl get pods,pvc -n kafka
```

**Pitfalls & fixes:**

PVCs bound to specific AZ and pod scheduling fails — use topology affinity and multi-AZ storage or a storage class that supports multi-AZ snapshots.

JVM tuning and disk I/O must be monitored.


## 12 — Secrets Management (Vault + CSI Secrets Store)

**What:** Vault or Cloud KMS with CSI Secrets Store to inject secrets into pods as files or env vars.

**Why:** Centralized secrets with rotation, audit logs, access policies.

**How (Vault + CSI quick):**

Install Vault (HA topology) or use managed secrets (AWS Secrets Manager).

Install CSI Secrets Store driver and provider for Vault/KMS.

Create Kubernetes `SecretProviderClass` to map external secrets to pods.

**Verify:**

Deploy pod that mounts secret and read file.

Check Vault audit logs.

**Pitfalls & fixes:**

Kubernetes service account not configured for Vault auth — configure proper approle or k8s auth method.


## 13 — Autoscaling (HPA, VPA, Cluster Autoscaler)

**What:** Horizontal Pod Autoscaler (HPA), Vertical Pod Autoscaler (VPA), Cluster Autoscaler for nodes.

**Why:** Maintain performance while optimizing cost.

**How:**

Install metrics-server:

```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

Create HPA:

```bash
kubectl autoscale deployment demo --cpu-percent=60 --min=2 --max=10
```

Install Cluster Autoscaler (via Helm or cloud-specific manifest) with node group tags.

**Verify:**

```bash
kubectl get hpa
kubectl get nodes
```

**Pitfalls & fixes:**

Incorrect metrics-server permissions → HPA won't scale. Check API aggregation layer.

Scale-down thrash — tune cooldowns.


## 14 — Security Controls & Policy Enforcement (RBAC, Pod Security, OPA/Gatekeeper)

**What:** RBAC hardening, PSP replacement (Pod Security Admission), OPA/Gatekeeper for policies.

**Why:** Prevent misconfigurations and enforce best practices.

**How:**

Define RBAC roles for namespaces and service accounts.

Install Gatekeeper and add a policy (e.g., disallow hostPath and privileged containers).

Enable Pod Security Admission with `restricted` for production namespaces.

**Verify:**

Try deploying a privileged pod and show Gatekeeper/PSA rejecting it.

**Pitfalls & fixes:**

Overly strict policies break legitimate apps — audit and adopt progressively.


## 15 — Backup & Disaster Recovery (Velero + PV snapshots)

**What:** Velero for cluster object backups and snapshot integration for PVs.

**Why:** Protect against accidental deletion and enable site recovery.

**How:**

```bash
velero install --provider aws --bucket <bucket> --secret-file ./credentials-velero
# Backup a namespace
velero backup create demo-backup --include-namespaces demo
# Restore
velero restore create --from-backup demo-backup
```

**Verify:**

```bash
velero backup get
velero restore get
# Delete a namespace and demonstrate restore
```

**Pitfalls & fixes:**

Snapshot provider compatibility — ensure CSI snapshots are supported.

Consistency for databases — use app-level backups for DBs (e.g., `pg_dump`) in addition to PV snapshots.


## 16 — Chaos Engineering & Runbooks (Drills)

**What:** Runbooks for common incidents (pod crash, node failure, PV loss) + chaos experiments (Chaos Mesh/Gremlin).

**Why:** Validate runbooks and platform resilience.

**How:**

Create runbooks in a central doc system (Confluence / Git repo).

Run a controlled chaos test: kill a node or evict a pod and follow runbook steps.

**Verify:**

Time to recovery, alerts triggered, SLO impact.

**Pitfalls & fixes:**

Unplanned cascading failures — always run chaos on a non-production or well-scoped segment.


## 17 — Cost Governance & Observability for Platform

**What:** Export cost metrics (cloud cost exporter), enforce `ResourceQuota` and `LimitRanges` per namespace.

**Why:** Keep cloud spend predictable and enforce quotas per team.

**How:**

Deploy cost-exporter or use cloud billing export to BigQuery/S3 + Grafana dashboards.

Add ResourceQuota to namespace:

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: team-quota
  namespace: team-a
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 32Gi
    limits.cpu: "20"
    limits.memory: 64Gi
```

**Verify:**

Try creating a deployment exceeding quota and show rejection.

**Pitfalls & fixes:**

Hard quotas block legitimate burst workloads — set quotas with headroom.


## 18 — Day 2 Ops: upgrades, backups, maintenance windows, and runbook testing

**What:** Documented upgrade process, daily/weekly maintenance (etcd backups, control plane patches), and scheduled DR drills.

**Why:** Production safety and predictable change management.

**How:**

Use cluster lifecycle tooling (eksctl/managed upgrade path).

Schedule maintenance windows and use PodDisruptionBudgets for critical workloads.

Automate etcd snapshots (if self-hosted).

**Verify:**

Perform a minor version upgrade in a staging cluster and show successful rollout.

**Pitfalls & fixes:**

Skipping PDBs can cause app downtime during upgrades — set PDBs for critical components.


## 19 — Observability & SLOs: Define SLIs, SLOs, Alerts & Runbooks

**What:** Meaningful SLIs (latency, error rate), SLO targets, and alerting rules in Prometheus/Alertmanager with clear runbooks.

**Why:** Drive engineering priorities and focus on customer-impacting metrics.

**How:**

Example Prometheus alert:

```yaml
groups:
- name: app.rules
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{job="app",status=~"5.."}[5m]) > 0.01
    for: 5m
    labels:
      severity: page
    annotations:
      summary: "High 5xx rate for app"
      runbook: "https://runbooks.example.com/high-5xx"
```

**Verify:**

Trigger alert via load test and show Alertmanager firing and notification.

**Pitfalls & fixes:**

Alert fatigue — tune thresholds and use alert routing for severity.


## 20 — Deliverables & Repo (finalize)

**What:** GitHub repo with:

- Terraform for infra
- Helm chart values for cert-manager, ingress, prometheus, fluentbit, argocd, linkerd/istio
- ArgoCD App manifests (app-of-apps)
- Runbooks and SLO definitions

**Why:** Reproducible platform and single source of truth.

**How:**

Structure repo:

```text
infra/        # terraform
clusters/prod # kustomize / helmfile
apps/         # apps and argocd apps
runbooks/     # markdown runbooks
```

**Verify:**

Show git clone then make bootstrap script that can deploy base platform to a dev cluster.

**Pitfalls & fixes:**

Secrets in Git — avoid by using SealedSecrets/Vault integration or SOPS.


