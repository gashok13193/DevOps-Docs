# Design High-Availability of a 3‑Tier System on Kubernetes

------------------------------------------------------------------------

## 1. Goal

**Goal:** Design  a production-grade, highly‑available 3‑tier
application running on Kubernetes. Show architecture, reliability
patterns, deployment manifests/Helm, CI/CD (GitOps), failure scenarios

**Audience:** DevOps engineers, SREs, platform engineers, intermediate
Kubernetes users.

------------------------------------------------------------------------

## 2. Architecture (summary)

3 tiers:

1.  **Frontend (Presentation layer)** --- static or dynamic web server
    (e.g., NGINX or Node.js), served via an Ingress/LoadBalancer with
    HTTPS.
2.  **Backend (Application layer / API)** --- stateless app (e.g.,
    Python/Go/Node microservice) behind a Kubernetes Service and
    horizontal autoscaling.
3.  **Database (Data layer)** --- stateful DB (Postgres/MySQL) using
    StatefulSet with persistent volumes and synchronous replication
    (primary + replicas).

Supporting components:

-   Ingress controller (NGINX Ingress or Traefik) + cert-manager for
    TLS.
-   External load balancer (cloud) or MetalLB for on-prem.
-   Prometheus + Grafana for monitoring, and Alertmanager.
-   Fluentd/Vector + Loki or Splunk for logging.
-   ArgoCD (GitOps) for deployments.
-   Optional service mesh (Istio/Linkerd) for mTLS/traffic control.

**HA patterns**

-   Multiple replicas per tier (\>=3 for frontend/backend).
-   Pod anti-affinity across nodes and AZs.
-   PodDisruptionBudgets and readiness/liveness probes.
-   StatefulSet with at least 1 replica for primary + replicas (or use
    operator like Patroni/Crunchy/Postgres Operator).
-   Use StorageClass with replication or multi-AZ storage.
-   Backup with Velero.

------------------------------------------------------------------------

## 3. Recommended topology (cloud example)

-   3 worker nodes across 2-3 AZs (or more).
-   Control plane managed (EKS/GKE/AKS) or HA control plane for on-prem.
-   NodePools: small, medium, db (larger storage/IO).

------------------------------------------------------------------------

## 4. Helm chart layout (single umbrella or 3 charts)

I recommend either a single umbrella chart with 3 subcharts or three
independent charts for lifecycle flexibility.

    charts/
      3tier-umbrella/
        Chart.yaml
        values.yaml
        charts/
          frontend/
          backend/
          database/

Each subchart contains `templates/deployment.yaml`, `service.yaml`,
`hpa.yaml` (frontend/backend), and `pdb.yaml`.

------------------------------------------------------------------------

## 5. Minimal Kubernetes manifests (copyable) --- frontend and backend

### Frontend Deployment (stateless)

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  labels:
    app: frontend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: frontend
                topologyKey: kubernetes.io/hostname
      containers:
        - name: frontend
          image: nginx:stable
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 80
            initialDelaySeconds: 15
            periodSeconds: 20
```

### Backend Deployment (stateless)

``` yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  labels:
    app: backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: backend
          image: your-registry/your-backend:latest
          ports:
            - containerPort: 8080
          env:
            - name: DATABASE_URL
              valueFrom:
                secretKeyRef:
                  name: db-creds
                  key: DATABASE_URL
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 3
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 20
```

### Backend Service

``` yaml
apiVersion: v1
kind: Service
metadata:
  name: backend
spec:
  selector:
    app: backend
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP
```

## 6. Database (stateful) — Postgres StatefulSet snippet

For production, use a DB operator (Patroni, Crunchy, Zalando Postgres Operator) — here’s a simple StatefulSet sample for demo only:
``` yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
spec:
  serviceName: postgres # Headless Service name for network identity
  replicas: 2
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: postgres-secret # Retrieves password from this Secret
                  key: password
          volumeMounts:
            - name: pgdata # Must match the name in volumeClaimTemplates
              mountPath: /var/lib/postgresql/data # Default PostgreSQL data path
  volumeClaimTemplates:
    - metadata:
        name: pgdata
      spec:
        accessModes: [ "ReadWriteOnce" ]
        resources:
          requests:
            storage: 20Gi # Request 20Gi of persistent storage for each replica
```
**Important:** This simple StatefulSet does not provide automatic leader election/replication — use an operator for production.

---

## 7. Service exposure and TLS

- Install an Ingress controller (nginx-ingress) and `cert-manager`.
- Create an `Ingress` that routes `/` to `frontend` and `/api` to `backend`.
- Use `ClusterIssuer` and `Certificate` to auto-issue TLS certs (Let’s Encrypt).

---

## 8. Reliability & safety objects

- **PodDisruptionBudget** to prevent too many voluntary disruptions.
- **HorizontalPodAutoscaler** for backend based on CPU/RPS.
- **Resource requests/limits** for all containers.
- **Readiness & liveness probes** as shown.
- **NetworkPolicies** to limit access (frontend -> backend, backend -> db only).
- **Secrets** stored in SealedSecrets or HashiCorp Vault; never plain YAML.

---

## 9. GitOps & CI/CD 

- Push Helm charts to `git` (repo: `infrastructure/3tier`).
- Use **ArgoCD** to watch repo and sync to cluster.
- Show a commit -> PR -> merged -> ArgoCD auto deploy demo.

---

## 10. Demo setup options (choose one)

**A. Local **

- Use `k3d` or `minikube` + `ingress` addon + `helm`.
- Use `MetalLB` for LoadBalancer simulation.
- Deploy the manifests above and show services, pods, logs.

**B. Cloud **

- Use a managed cluster (EKS/GKE/AKS).
- Show real LB and DNS via a subdomain.
- Deploy cert-manager and use Let's Encrypt staging for demo.

---

## 11. Monitoring & alerts

- Prometheus scrape targets: kube-state-metrics, node-exporter, app metrics.
- Create Grafana dashboards for requests/success rates/latency/DB connections.
- Simple alert: high 5xx rate ➜ Alertmanager webhook ➜ Slack.

---
