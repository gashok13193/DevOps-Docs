# ============================================
# DevOps Interview Questions - Quick Reference
# ============================================

## Table of Contents
1. [CI/CD Pipeline Concepts](#cicd-pipeline-concepts)
2. [Jenkins Deep Dive](#jenkins-deep-dive)
3. [Docker & Containerization](#docker--containerization)
4. [Kubernetes Core Concepts](#kubernetes-core-concepts)
5. [Helm Package Manager](#helm-package-manager)
6. [ArgoCD & GitOps](#argocd--gitops)
7. [SonarQube & Quality](#sonarqube--quality)
8. [Security Best Practices](#security-best-practices)
9. [Monitoring & Observability](#monitoring--observability)
10. [Scenario-Based Questions](#scenario-based-questions)

---

## CI/CD Pipeline Concepts

### Q: What is CI/CD? Explain the difference.
**Answer:**
- **CI (Continuous Integration)**: Developers frequently merge code to main branch, automated build and tests run on each merge
- **CD (Continuous Delivery)**: Code is always in deployable state, deployment to production requires manual approval
- **CD (Continuous Deployment)**: Every change that passes tests is automatically deployed to production

### Q: What are the stages of a typical CI/CD pipeline?
**Answer:**
1. **Source**: Code checkout from Git
2. **Build**: Compile, dependency resolution
3. **Test**: Unit tests, integration tests
4. **Analysis**: Code quality, security scanning
5. **Package**: Create artifacts (JAR, Docker image)
6. **Deploy**: Deploy to target environment
7. **Verify**: Smoke tests, health checks
8. **Release**: Production deployment

### Q: What is GitOps?
**Answer:**
GitOps is a way of implementing continuous deployment for cloud-native applications. Key principles:
- Git as single source of truth
- Declarative descriptions of infrastructure
- Changes through pull requests
- Automated sync between Git and cluster

---

## Jenkins Deep Dive

### Q: What is Jenkins Pipeline as Code?
**Answer:**
Pipeline as Code means defining CI/CD pipeline in a Jenkinsfile stored in SCM. Benefits:
- Version controlled
- Code review for pipeline changes
- Reproducible builds
- Self-documenting

### Q: Explain agent directive in Jenkins Pipeline
**Answer:**
```groovy
// Run on any available agent
agent any

// Run on agent with specific label
agent { label 'linux' }

// Run in Docker container
agent { docker { image 'maven:3.9' } }

// Run in Kubernetes pod
agent { kubernetes { yaml '...' } }

// Don't allocate agent at pipeline level
agent none
```

### Q: What is Jenkins Shared Library?
**Answer:**
Reusable Groovy code stored in separate repo:
```
├── vars/          # Global functions
│   └── buildJava.groovy
├── src/           # Groovy classes
└── resources/     # Non-Groovy resources
```

Usage:
```groovy
@Library('my-shared-lib') _
pipeline {
    stages {
        stage('Build') {
            steps { buildJava() }
        }
    }
}
```

### Q: How do you handle secrets in Jenkins?
**Answer:**
1. **Credentials Plugin**: Store encrypted in Jenkins
2. **withCredentials**: Inject into pipeline
3. **HashiCorp Vault**: External secret management
4. **AWS Secrets Manager**: Cloud-native option

```groovy
withCredentials([string(credentialsId: 'my-secret', variable: 'SECRET')]) {
    sh 'echo $SECRET'  // Masked in logs
}
```

---

## Docker & Containerization

### Q: What is a multi-stage Docker build?
**Answer:**
Multiple FROM statements to separate build and runtime:
```dockerfile
# Build stage
FROM maven:3.9 AS builder
COPY . .
RUN mvn package

# Runtime stage (smaller image)
FROM eclipse-temurin:17-jre
COPY --from=builder /app/target/app.jar .
CMD ["java", "-jar", "app.jar"]
```

Benefits:
- Smaller final image
- Separate build dependencies from runtime
- Better security (less attack surface)

### Q: What's the difference between COPY and ADD?
**Answer:**
- **COPY**: Simple file/directory copy
- **ADD**: Can extract tar files, fetch URLs

Best practice: Use COPY unless you need ADD's features.

### Q: Docker best practices for production?
**Answer:**
1. Use specific base image tags (not `latest`)
2. Run as non-root user
3. Use multi-stage builds
4. Minimize layers
5. Use .dockerignore
6. Scan for vulnerabilities
7. Set resource limits
8. Use HEALTHCHECK

### Q: How to reduce Docker image size?
**Answer:**
1. Use Alpine-based images
2. Multi-stage builds
3. Combine RUN commands
4. Remove unnecessary files
5. Use .dockerignore
6. Don't include build tools in final image

---

## Kubernetes Core Concepts

### Q: Explain Kubernetes architecture
**Answer:**
**Control Plane:**
- **API Server**: Frontend for K8s
- **etcd**: Key-value store for cluster data
- **Scheduler**: Assigns pods to nodes
- **Controller Manager**: Manages controllers

**Worker Nodes:**
- **kubelet**: Ensures containers run in pods
- **kube-proxy**: Network proxy
- **Container Runtime**: Docker/containerd

### Q: What is a Pod?
**Answer:**
Smallest deployable unit in Kubernetes. Contains:
- One or more containers
- Shared network namespace
- Shared storage volumes
- Shared lifecycle

### Q: Deployment vs StatefulSet vs DaemonSet?
**Answer:**
| Feature | Deployment | StatefulSet | DaemonSet |
|---------|------------|-------------|-----------|
| Scaling | Any order | Ordered | One per node |
| Identity | Interchangeable | Sticky identity | N/A |
| Storage | Ephemeral | Persistent | Node-level |
| Use case | Stateless apps | Databases | Node agents |

### Q: Explain Services in Kubernetes
**Answer:**
- **ClusterIP**: Internal IP, default type
- **NodePort**: Exposes on node's IP:port
- **LoadBalancer**: External load balancer
- **ExternalName**: CNAME to external service

### Q: What are probes in Kubernetes?
**Answer:**
- **Liveness**: Is container alive? Restart if fails
- **Readiness**: Is container ready? Remove from service if fails
- **Startup**: Has container started? Blocks other probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  exec:
    command: ["cat", "/tmp/ready"]
  initialDelaySeconds: 5
  periodSeconds: 5
```

### Q: What is HPA (Horizontal Pod Autoscaler)?
**Answer:**
Automatically scales pod replicas based on metrics:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: my-app
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Q: What is PodDisruptionBudget?
**Answer:**
Ensures minimum availability during voluntary disruptions:

```yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 2  # or maxUnavailable: 1
  selector:
    matchLabels:
      app: my-app
```

---

## Helm Package Manager

### Q: What is Helm and why use it?
**Answer:**
- Package manager for Kubernetes
- Templates for K8s manifests
- Release management
- Dependency management
- Values-based customization

### Q: Explain Helm chart structure
**Answer:**
```
mychart/
├── Chart.yaml          # Chart metadata
├── values.yaml         # Default values
├── charts/             # Dependencies
├── templates/          # K8s manifest templates
│   ├── _helpers.tpl    # Template helpers
│   ├── deployment.yaml
│   ├── service.yaml
│   └── NOTES.txt       # Usage notes
└── .helmignore         # Ignore patterns
```

### Q: How do values work in Helm?
**Answer:**
Priority (lowest to highest):
1. `values.yaml` in chart
2. Parent chart's `values.yaml`
3. `-f` flag files
4. `--set` flag values

```bash
helm install myapp ./chart \
  -f custom-values.yaml \
  --set image.tag=1.2.3
```

### Q: What are Helm hooks?
**Answer:**
Run at specific points in release lifecycle:
- `pre-install`: Before resources installed
- `post-install`: After resources installed
- `pre-upgrade`: Before upgrade
- `post-upgrade`: After upgrade
- `pre-delete`: Before deletion

```yaml
annotations:
  "helm.sh/hook": pre-upgrade
  "helm.sh/hook-weight": "-5"
  "helm.sh/hook-delete-policy": hook-succeeded
```

---

## ArgoCD & GitOps

### Q: What is ArgoCD?
**Answer:**
GitOps continuous delivery tool for Kubernetes:
- Watches Git repositories
- Syncs desired state to cluster
- Provides UI for visualization
- Supports Helm, Kustomize, plain YAML

### Q: Explain ArgoCD sync policies
**Answer:**
```yaml
syncPolicy:
  automated:
    prune: true      # Delete extra resources
    selfHeal: true   # Revert manual changes
  syncOptions:
    - CreateNamespace=true
    - PrunePropagationPolicy=foreground
```

### Q: What is App of Apps pattern?
**Answer:**
Root Application manages child Applications:
```
argocd/
├── app-of-apps.yaml      # Root app points to apps/
└── apps/
    ├── app1.yaml         # Child applications
    ├── app2.yaml
    └── app3.yaml
```

Benefits:
- Single entry point
- Manage multiple apps together
- Sync waves for ordering

### Q: What is ApplicationSet?
**Answer:**
Dynamically generate Applications from templates:
- **List Generator**: Fixed list of values
- **Cluster Generator**: All registered clusters
- **Git Generator**: Based on Git structure
- **Matrix Generator**: Combine generators

### Q: How does ArgoCD handle secrets?
**Answer:**
Options:
1. **Sealed Secrets**: Encrypted, safe for Git
2. **External Secrets Operator**: Fetch from Vault/AWS
3. **ArgoCD Vault Plugin**: Decrypt at sync time
4. **SOPS**: Mozilla SOPS encryption

---

## SonarQube & Quality

### Q: What is SonarQube?
**Answer:**
Code quality and security analysis platform:
- Static code analysis
- Bug detection
- Vulnerability scanning
- Code coverage
- Technical debt tracking

### Q: What is a Quality Gate?
**Answer:**
Pass/fail conditions for code quality:
- Coverage >= 80%
- Duplications <= 3%
- No new bugs
- No new vulnerabilities
- Maintainability rating A

### Q: Explain SonarQube metrics
**Answer:**
- **Bugs**: Code that's wrong
- **Vulnerabilities**: Security issues
- **Code Smells**: Maintainability issues
- **Coverage**: Percent of code tested
- **Duplications**: Repeated code
- **Technical Debt**: Time to fix all smells

---

## Security Best Practices

### Q: Container security best practices?
**Answer:**
1. Use non-root user
2. Read-only root filesystem
3. No privilege escalation
4. Drop all capabilities
5. Scan images for vulnerabilities
6. Use signed images
7. Network policies for isolation

```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
  capabilities:
    drop: ["ALL"]
```

### Q: How to manage secrets in Kubernetes?
**Answer:**
1. **K8s Secrets**: Base64 encoded (not encrypted)
2. **Sealed Secrets**: Encrypted for Git
3. **External Secrets**: Sync from Vault/AWS
4. **CSI Secret Store**: Mount secrets as volumes
5. **HashiCorp Vault**: Enterprise secret management

### Q: What are Network Policies?
**Answer:**
Control traffic between pods:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-all
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
```

---

## Monitoring & Observability

### Q: Three pillars of observability?
**Answer:**
1. **Logs**: Event records (ELK, Loki)
2. **Metrics**: Numerical data (Prometheus)
3. **Traces**: Request flow (Jaeger, Zipkin)

### Q: What is Prometheus?
**Answer:**
Time-series database and monitoring system:
- Pull-based metrics collection
- PromQL query language
- Alerting rules
- Service discovery

### Q: How does ServiceMonitor work?
**Answer:**
Custom resource for Prometheus Operator:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
spec:
  selector:
    matchLabels:
      app: my-app
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

---

## Scenario-Based Questions

### Q: How would you implement zero-downtime deployment?
**Answer:**
1. Use Rolling Update strategy
2. Configure readiness probes
3. Set PodDisruptionBudget
4. Pre-warm connections
5. Use graceful shutdown

```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

### Q: How do you handle database migrations in CI/CD?
**Answer:**
1. **Helm Hooks**: Pre-upgrade job
2. **Init Containers**: Run before app
3. **Separate Pipeline**: Migration-first approach
4. **Tools**: Flyway, Liquibase

### Q: How do you implement blue-green deployment?
**Answer:**
1. Deploy new version alongside old
2. Test new version
3. Switch traffic instantly
4. Keep old version for rollback

### Q: How do you troubleshoot a failing deployment?
**Answer:**
1. Check pod status: `kubectl get pods`
2. Describe pod: `kubectl describe pod`
3. Check logs: `kubectl logs`
4. Check events: `kubectl get events`
5. Verify resources (CPU/memory)
6. Check network policies
7. Verify secrets/configmaps

### Q: How do you handle secrets rotation?
**Answer:**
1. Use external secret management (Vault)
2. Implement zero-downtime rotation
3. Update applications to reload secrets
4. Automate rotation schedule
5. Audit access patterns

---

## Command Cheat Sheet

### kubectl
```bash
kubectl get pods -A                    # All pods
kubectl describe pod <name>            # Pod details
kubectl logs <pod> -f                  # Follow logs
kubectl exec -it <pod> -- /bin/sh     # Shell into pod
kubectl rollout restart deploy/<name>  # Restart deployment
kubectl rollout undo deploy/<name>     # Rollback
```

### Helm
```bash
helm install <release> <chart>         # Install
helm upgrade <release> <chart>         # Upgrade
helm rollback <release> <revision>     # Rollback
helm list -A                           # List releases
helm template <release> <chart>        # Render templates
```

### ArgoCD
```bash
argocd app list                        # List apps
argocd app sync <app>                  # Sync app
argocd app rollback <app> <rev>        # Rollback
argocd app diff <app>                  # Show diff
argocd app delete <app>                # Delete app
```

---

*Last Updated: March 2026*
