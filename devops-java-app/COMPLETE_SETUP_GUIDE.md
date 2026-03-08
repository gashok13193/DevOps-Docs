# ============================================
# DevOps CI/CD Pipeline - Complete Setup Guide
# ============================================
# 
# This comprehensive guide covers end-to-end setup of a production-grade
# CI/CD pipeline for Java applications using modern DevOps tools.
#
# Author: Ashok Kumar
# Last Updated: March 2026

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Infrastructure Setup](#infrastructure-setup)
3. [Jenkins Setup](#jenkins-setup)
4. [SonarQube Setup](#sonarqube-setup)
5. [Artifactory Setup](#artifactory-setup)
6. [Docker Registry Setup](#docker-registry-setup)
7. [Kubernetes Cluster Setup](#kubernetes-cluster-setup)
8. [ArgoCD Setup](#argocd-setup)
9. [End-to-End Pipeline Walkthrough](#end-to-end-pipeline-walkthrough)
10. [Interview Questions & Answers](#interview-questions--answers)
11. [Real Production Scenarios](#real-production-scenarios)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Prerequisites

### Required Software
| Tool | Version | Purpose |
|------|---------|---------|
| Java | 17+ | Application runtime |
| Maven | 3.9+ | Build tool |
| Docker | 24.0+ | Containerization |
| kubectl | 1.28+ | Kubernetes CLI |
| Helm | 3.13+ | Kubernetes package manager |
| Git | 2.40+ | Version control |

### Infrastructure Requirements
- Kubernetes cluster (EKS/AKS/GKE or on-premises)
- Jenkins server with proper resources (4GB RAM minimum)
- SonarQube server
- Artifactory/Nexus repository
- Container registry (Docker Hub, ECR, ACR, GCR)

---

## Infrastructure Setup

### Step 1: Create Kubernetes Cluster

#### Option A: AWS EKS
```bash
# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create EKS cluster
eksctl create cluster \
  --name devops-cluster \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# Update kubeconfig
aws eks update-kubeconfig --name devops-cluster --region us-west-2
```

#### Option B: Minikube (Local Development)
```bash
# Start minikube with sufficient resources
minikube start \
  --driver=docker \
  --cpus=4 \
  --memory=8192 \
  --disk-size=50g \
  --kubernetes-version=v1.28.0

# Enable required addons
minikube addons enable ingress
minikube addons enable metrics-server
minikube addons enable dashboard
```

### Step 2: Install Required Tools

```bash
# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Verify installation
helm version

# Add common Helm repositories
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
```

---

## Jenkins Setup

### Step 1: Install Jenkins on Kubernetes

```bash
# Create namespace
kubectl create namespace jenkins

# Add Jenkins Helm repo
helm repo add jenkins https://charts.jenkins.io
helm repo update

# Create custom values file
cat > jenkins-values.yaml << 'EOF'
controller:
  # Jenkins version
  tag: "2.426.2-lts"
  
  # Resources
  resources:
    requests:
      cpu: "500m"
      memory: "1Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"
  
  # Service configuration
  serviceType: LoadBalancer
  
  # Install plugins
  installPlugins:
    - kubernetes:4029.v5712230ccb_f8
    - workflow-aggregator:596.v8c21c963d92d
    - git:5.2.0
    - configuration-as-code:1714.v09e3f051b_454
    - job-dsl:1.84
    - pipeline-stage-view:2.33
    - blueocean:1.27.9
    - credentials-binding:642.v737c34dea_6c2
    - pipeline-utility-steps:2.16.0
    - sonar:2.16.0
    - artifactory:3.18.10
    - docker-workflow:572.v950f58993843
    - kubernetes-credentials:0.10.0
    - slack:684.v833089650554
    - email-ext:2.99
    - jacoco:3.3.4
    
  # Admin password (change in production)
  adminPassword: "admin123"
  
  # JCasC configuration
  JCasC:
    configScripts:
      welcome-message: |
        jenkins:
          systemMessage: "Jenkins configured via JCasC"

persistence:
  enabled: true
  size: 50Gi

# Agent configuration
agent:
  enabled: true
  namespace: jenkins
  image: jenkins/inbound-agent
  tag: latest
  
EOF

# Install Jenkins
helm install jenkins jenkins/jenkins \
  -n jenkins \
  -f jenkins-values.yaml

# Get admin password
kubectl get secret jenkins -n jenkins -o jsonpath="{.data.jenkins-admin-password}" | base64 --decode
```

### Step 2: Required Jenkins Plugins (Detailed)

| Plugin | Purpose | Installation |
|--------|---------|--------------|
| **Kubernetes** | Run Jenkins agents in K8s | Required for K8s-based builds |
| **Pipeline** | Jenkinsfile support | Core plugin for pipeline as code |
| **Git** | Git integration | SCM checkout |
| **SonarQube Scanner** | Code quality analysis | Integrates with SonarQube |
| **Artifactory** | Artifact management | Upload to JFrog Artifactory |
| **Docker Pipeline** | Docker build/push | Container image creation |
| **Credentials Binding** | Secure credentials | Handle secrets in pipeline |
| **Blue Ocean** | Modern UI | Better pipeline visualization |
| **Slack Notification** | Chat notifications | Alert team on build status |
| **Email Extension** | Email notifications | Detailed email alerts |
| **JaCoCo** | Code coverage | Test coverage reports |

### Step 3: Configure Jenkins Credentials

Navigate to: **Manage Jenkins → Credentials → System → Global credentials**

Add the following credentials:

#### 3.1 Git Credentials
```
Kind: Username with password
Scope: Global
Username: <git-username>
Password: <personal-access-token>
ID: git-credentials
Description: GitHub/GitLab credentials
```

#### 3.2 Docker Registry Credentials
```
Kind: Username with password
Scope: Global
Username: <registry-username>
Password: <registry-password>
ID: docker-registry-credentials
Description: Container registry credentials
```

#### 3.3 SonarQube Token
```
Kind: Secret text
Scope: Global
Secret: <sonarqube-token>
ID: sonarqube-token
Description: SonarQube authentication token
```

#### 3.4 Artifactory Credentials
```
Kind: Username with password
Scope: Global
Username: <artifactory-username>
Password: <artifactory-api-key>
ID: artifactory-credentials
Description: JFrog Artifactory credentials
```

### Step 4: Configure Global Tools

Navigate to: **Manage Jenkins → Tools**

#### Maven Installation
```
Name: Maven-3.9
Install automatically: Yes
Version: 3.9.6
```

#### JDK Installation
```
Name: JDK-17
Install automatically: Yes
Version: OpenJDK 17
```

---

## SonarQube Setup

### Step 1: Install SonarQube

```bash
# Create namespace
kubectl create namespace sonarqube

# Install PostgreSQL for SonarQube
helm install sonar-db bitnami/postgresql \
  -n sonarqube \
  --set auth.database=sonarqube \
  --set auth.username=sonar \
  --set auth.password=sonarpassword \
  --set primary.persistence.size=10Gi

# Wait for PostgreSQL to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgresql -n sonarqube --timeout=120s

# Create SonarQube values
cat > sonarqube-values.yaml << 'EOF'
resources:
  requests:
    cpu: "500m"
    memory: "2Gi"
  limits:
    cpu: "2000m"
    memory: "4Gi"

persistence:
  enabled: true
  size: 10Gi

postgresql:
  enabled: false

jdbcOverwrite:
  enabled: true
  jdbcUrl: "jdbc:postgresql://sonar-db-postgresql:5432/sonarqube"
  jdbcUsername: "sonar"
  jdbcPassword: "sonarpassword"

service:
  type: LoadBalancer

plugins:
  install:
    - "https://github.com/checkstyle/sonar-checkstyle/releases/download/10.12.4/checkstyle-sonar-plugin-10.12.4.jar"
    - "https://github.com/SonarSource/sonar-java/releases/download/7.30.0.34429/sonar-java-plugin-7.30.0.34429.jar"
EOF

# Install SonarQube
helm repo add sonarqube https://SonarSource.github.io/helm-chart-sonarqube
helm repo update
helm install sonarqube sonarqube/sonarqube \
  -n sonarqube \
  -f sonarqube-values.yaml
```

### Step 2: Configure SonarQube

1. **Access SonarQube UI**
   ```bash
   # Get LoadBalancer IP
   kubectl get svc sonarqube-sonarqube -n sonarqube
   ```
   - Default credentials: admin/admin
   - Change password immediately

2. **Create Project**
   - Go to Projects → Create Project Manually
   - Project key: `devops-java-app`
   - Display name: `DevOps Java App`

3. **Generate Token**
   - Go to My Account → Security → Generate Tokens
   - Name: `jenkins-token`
   - Type: Global Analysis Token
   - Copy and save the token

4. **Configure Quality Gate**
   - Go to Quality Gates → Create
   - Add conditions:
     - Coverage < 80% → Failed
     - Duplicated Lines > 3% → Failed
     - Maintainability Rating worse than A → Failed
     - Reliability Rating worse than A → Failed
     - Security Rating worse than A → Failed

### Step 3: Configure Jenkins SonarQube Integration

Navigate to: **Manage Jenkins → System → SonarQube servers**

```
Name: SonarQube
Server URL: http://sonarqube-sonarqube.sonarqube:9000
Server authentication token: <select sonarqube-token credential>
```

---

## Artifactory Setup

### Step 1: Install JFrog Artifactory

```bash
# Create namespace
kubectl create namespace artifactory

# Add JFrog Helm repo
helm repo add jfrog https://charts.jfrog.io
helm repo update

# Create values file
cat > artifactory-values.yaml << 'EOF'
artifactory:
  resources:
    requests:
      cpu: "500m"
      memory: "2Gi"
    limits:
      cpu: "2000m"
      memory: "4Gi"
      
  persistence:
    enabled: true
    size: 50Gi

postgresql:
  enabled: true
  persistence:
    enabled: true
    size: 10Gi

nginx:
  enabled: true
  service:
    type: LoadBalancer
EOF

# Install Artifactory OSS (or use Pro license)
helm install artifactory jfrog/artifactory-oss \
  -n artifactory \
  -f artifactory-values.yaml
```

### Step 2: Configure Artifactory

1. **Create Repositories**
   - Local Repository: `libs-release-local` (Maven)
   - Local Repository: `libs-snapshot-local` (Maven)
   - Local Repository: `docker-local` (Docker)
   - Remote Repository: `jcenter` (Maven Central proxy)
   - Virtual Repository: `libs-release` (includes local and remote)

2. **Create User for Jenkins**
   - Username: `jenkins-deployer`
   - Grant deploy permissions to all repositories

3. **Generate API Key**
   - Go to User Profile → API Key
   - Generate and save

---

## Docker Registry Setup

### Option A: Use Cloud Registry

#### AWS ECR
```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name devops-java-app \
  --region us-west-2

# Get login command
aws ecr get-login-password --region us-west-2 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-west-2.amazonaws.com
```

#### Docker Hub
```bash
# Login to Docker Hub
docker login -u <username>
# Enter password when prompted
```

### Option B: Self-hosted Registry

```bash
# Install Harbor registry
helm repo add harbor https://helm.goharbor.io
helm repo update

# Create values
cat > harbor-values.yaml << 'EOF'
expose:
  type: loadBalancer
  tls:
    enabled: true
    certSource: auto

persistence:
  enabled: true
  imageChartStorage:
    type: filesystem
    filesystem:
      rootdirectory: /storage
    
externalURL: https://registry.company.com

harborAdminPassword: "Harbor12345"
EOF

# Install Harbor
kubectl create namespace harbor
helm install harbor harbor/harbor \
  -n harbor \
  -f harbor-values.yaml
```

---

## Kubernetes Cluster Setup

### Step 1: Install NGINX Ingress Controller

```bash
# Install NGINX Ingress
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.service.type=LoadBalancer \
  --set controller.metrics.enabled=true \
  --set controller.metrics.serviceMonitor.enabled=true
```

### Step 2: Install Cert-Manager (TLS)

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.2/cert-manager.yaml

# Wait for cert-manager to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/instance=cert-manager -n cert-manager --timeout=120s

# Create ClusterIssuer for Let's Encrypt
cat << 'EOF' | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: devops@company.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

### Step 3: Install Monitoring Stack

```bash
# Install Prometheus and Grafana
helm install prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false \
  --set grafana.adminPassword=admin123

# Access Grafana
kubectl port-forward svc/prometheus-stack-grafana 3000:80 -n monitoring
```

### Step 4: Create Application Namespaces

```bash
# Create namespaces for different environments
kubectl create namespace devops-dev
kubectl create namespace devops-staging
kubectl create namespace devops-prod

# Label namespaces
kubectl label namespace devops-dev environment=development
kubectl label namespace devops-staging environment=staging
kubectl label namespace devops-prod environment=production

# Create image pull secrets in each namespace
kubectl create secret docker-registry registry-credentials \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n devops-dev

kubectl create secret docker-registry registry-credentials \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n devops-staging

kubectl create secret docker-registry registry-credentials \
  --docker-server=<registry-url> \
  --docker-username=<username> \
  --docker-password=<password> \
  -n devops-prod
```

---

## ArgoCD Setup

### Step 1: Install ArgoCD

```bash
# Create namespace
kubectl create namespace argocd

# Install ArgoCD
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for ArgoCD to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

# Expose ArgoCD Server
kubectl patch svc argocd-server -n argocd -p '{"spec": {"type": "LoadBalancer"}}'

# Get initial admin password
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d
```

### Step 2: Install ArgoCD CLI

```bash
# Linux
curl -sSL -o argocd-linux-amd64 https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
sudo install -m 555 argocd-linux-amd64 /usr/local/bin/argocd
rm argocd-linux-amd64

# macOS
brew install argocd

# Windows (PowerShell)
$version = (Invoke-RestMethod https://api.github.com/repos/argoproj/argo-cd/releases/latest).tag_name
Invoke-WebRequest -Uri "https://github.com/argoproj/argo-cd/releases/download/$version/argocd-windows-amd64.exe" -OutFile argocd.exe
Move-Item .\argocd.exe C:\Windows\System32\
```

### Step 3: Configure ArgoCD

```bash
# Login to ArgoCD
argocd login <argocd-server-ip> --username admin --password <password>

# Change admin password
argocd account update-password

# Add Git repository
argocd repo add https://github.com/your-org/devops-java-app.git \
  --username <git-user> \
  --password <git-token>

# Add cluster (if deploying to external cluster)
argocd cluster add <context-name>

# Create the App of Apps
kubectl apply -f argocd/app-of-apps.yaml
```

### Step 4: Configure ArgoCD RBAC

```yaml
# Create ArgoCD ConfigMap for RBAC
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-rbac-cm
  namespace: argocd
data:
  policy.default: role:readonly
  policy.csv: |
    # Admins can do everything
    g, devops-admins, role:admin
    
    # Developers can sync dev environment
    p, role:developer, applications, get, */*, allow
    p, role:developer, applications, sync, */devops-java-app-dev, allow
    g, developers, role:developer
    
    # Production team can sync production
    p, role:production-deployer, applications, get, */*, allow
    p, role:production-deployer, applications, sync, */devops-java-app-prod, allow
    g, production-team, role:production-deployer
```

---

## End-to-End Pipeline Walkthrough

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CI/CD PIPELINE FLOW                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Developer                                                                   │
│      │                                                                       │
│      ▼                                                                       │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐           │
│  │   Git    │────▶│ Jenkins  │────▶│ SonarQube│────▶│Artifactory│          │
│  │ (GitHub) │     │   (CI)   │     │(Analysis)│     │ (Artifact)│          │
│  └──────────┘     └──────────┘     └──────────┘     └──────────┘           │
│                         │                                 │                  │
│                         ▼                                 │                  │
│                   ┌──────────┐                           │                  │
│                   │  Docker  │◀──────────────────────────┘                  │
│                   │ Registry │                                              │
│                   └──────────┘                                              │
│                         │                                                    │
│                         ▼                                                    │
│                   ┌──────────┐                                              │
│                   │  ArgoCD  │  ◀── GitOps (watches Git for changes)       │
│                   │   (CD)   │                                              │
│                   └──────────┘                                              │
│                         │                                                    │
│        ┌────────────────┼────────────────┐                                  │
│        ▼                ▼                ▼                                  │
│   ┌─────────┐     ┌──────────┐    ┌──────────┐                             │
│   │   DEV   │     │ STAGING  │    │   PROD   │                             │
│   │ Cluster │     │  Cluster │    │  Cluster │                             │
│   └─────────┘     └──────────┘    └──────────┘                             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step Execution

#### 1. Developer Pushes Code
```bash
git add .
git commit -m "feat: Add new feature"
git push origin main
```

#### 2. Jenkins Pipeline Triggered
- Webhook triggers Jenkins build
- Pipeline stages execute sequentially:
  1. **Git Checkout** - Clones repository
  2. **Build** - Compiles Java code with Maven
  3. **Unit Tests** - Runs tests, generates coverage
  4. **SonarQube Analysis** - Code quality scan
  5. **Quality Gate** - Pass/fail based on metrics
  6. **Package** - Creates JAR artifact
  7. **Push to Artifactory** - Uploads artifact
  8. **Build Docker Image** - Multi-stage build
  9. **Security Scan** - Trivy vulnerability scan
  10. **Push Docker Image** - Push to registry
  11. **Update Helm Chart** - Update image tag in Git

#### 3. ArgoCD Detects Changes
- ArgoCD polls Git repository (every 3 minutes default)
- Detects new image tag in Helm values
- Shows "OutOfSync" status

#### 4. Deployment to Kubernetes
```bash
# For dev/staging (auto-sync enabled)
# ArgoCD automatically syncs

# For production (manual sync)
argocd app sync devops-java-app-prod
```

#### 5. Verification
```bash
# Check pods
kubectl get pods -n devops-prod -l app=devops-java-app

# Check service
kubectl get svc -n devops-prod

# Test health endpoint
curl http://<ingress-url>/actuator/health
```

---

## Interview Questions & Answers

### Jenkins Questions

**Q1: What is the difference between Declarative and Scripted Pipeline?**
```
Declarative Pipeline:
- Structured, opinionated syntax
- Uses 'pipeline' block
- Easier to read and write
- Validates syntax before execution
- Best for standard CI/CD workflows

Scripted Pipeline:
- Groovy-based, more flexible
- Uses 'node' block
- Full programming power
- No pre-execution validation
- Best for complex logic requirements

Example Declarative:
pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                sh 'mvn clean package'
            }
        }
    }
}

Example Scripted:
node {
    stage('Build') {
        sh 'mvn clean package'
    }
}
```

**Q2: How do you handle credentials securely in Jenkins?**
```
1. Use Jenkins Credentials Plugin
2. Store credentials in Jenkins credential store (encrypted)
3. Use credentials binding in pipeline:

withCredentials([
    usernamePassword(credentialsId: 'git-creds', 
                     usernameVariable: 'GIT_USER', 
                     passwordVariable: 'GIT_PASS')
]) {
    sh 'git clone https://${GIT_USER}:${GIT_PASS}@github.com/repo.git'
}

4. Never hardcode credentials
5. Use HashiCorp Vault for enterprise
6. Rotate credentials regularly
```

**Q3: What is a Jenkins Shared Library?**
```
A reusable collection of Groovy scripts that can be used across multiple pipelines.

Structure:
├── vars/
│   └── myPipeline.groovy    # Global variables/functions
├── src/
│   └── com/company/         # Groovy classes
└── resources/               # Non-Groovy files

Usage in Jenkinsfile:
@Library('my-shared-library') _

pipeline {
    stages {
        stage('Build') {
            steps {
                myPipeline.build()
            }
        }
    }
}

Benefits:
- Code reuse across teams
- Centralized maintenance
- Version control
- Standardization
```

### Docker Questions

**Q4: Explain multi-stage Docker builds**
```
Multi-stage builds use multiple FROM statements to:
1. Reduce final image size
2. Separate build and runtime environments
3. Keep secrets out of final image

Example:
# Stage 1: Build
FROM maven:3.9 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn package -DskipTests

# Stage 2: Runtime (only this stage in final image)
FROM eclipse-temurin:17-jre-alpine
COPY --from=builder /app/target/app.jar app.jar
CMD ["java", "-jar", "app.jar"]

Result: Final image only contains JRE and JAR, not Maven or source code.
```

**Q5: What is the difference between ENTRYPOINT and CMD?**
```
ENTRYPOINT:
- Defines the main executable
- Cannot be easily overridden at runtime
- Used for container's primary purpose

CMD:
- Provides default arguments
- Can be overridden by docker run arguments
- Used for default behavior

Example:
ENTRYPOINT ["java", "-jar"]
CMD ["app.jar"]

docker run myimage                    # Runs: java -jar app.jar
docker run myimage other.jar          # Runs: java -jar other.jar

Best Practice:
Use ENTRYPOINT for the command, CMD for default arguments
```

### Kubernetes Questions

**Q6: What is the difference between Deployment, StatefulSet, and DaemonSet?**
```
Deployment:
- Stateless applications
- Pods are interchangeable
- Rolling updates supported
- Use for: web servers, APIs

StatefulSet:
- Stateful applications
- Pods have stable network identity
- Ordered deployment/scaling
- Use for: databases, Kafka, Zookeeper

DaemonSet:
- Runs one pod per node
- Automatically schedules on new nodes
- Use for: log collectors, monitoring agents, node-level services

Example scenarios:
- Java REST API → Deployment
- PostgreSQL cluster → StatefulSet
- Prometheus Node Exporter → DaemonSet
```

**Q7: Explain liveness and readiness probes**
```
Liveness Probe:
- "Is the container alive?"
- If fails → container is restarted
- Detects deadlocks, infinite loops
- Don't make dependent on external services

Readiness Probe:
- "Is the container ready for traffic?"
- If fails → removed from Service endpoints
- Traffic stops until ready again
- Can depend on external services

Startup Probe:
- "Has the container started?"
- Used for slow-starting containers
- Other probes disabled until startup succeeds

Example:
livenessProbe:
  httpGet:
    path: /actuator/health/liveness
    port: 8080
  initialDelaySeconds: 60
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5
```

**Q8: How does HPA (Horizontal Pod Autoscaler) work?**
```
Components:
1. Metrics Server - collects CPU/memory metrics
2. HPA Controller - makes scaling decisions
3. Target Deployment - scaled up/down

Flow:
1. HPA queries metrics every 15 seconds (default)
2. Calculates desired replicas:
   desiredReplicas = ceil(currentReplicas × (currentMetric / desiredMetric))
3. Scales deployment if needed
4. Respects min/max replica limits
5. Cooldown period prevents thrashing

Example:
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

### Helm Questions

**Q9: What is the difference between helm install, upgrade, and rollback?**
```
helm install:
- Creates new release
- Applies all templates to cluster
- Fails if release already exists
helm install myapp ./chart

helm upgrade:
- Updates existing release
- Applies changes incrementally
- Creates new revision
helm upgrade myapp ./chart

helm upgrade --install:
- Installs if not exists, upgrades if exists
- Best for CI/CD pipelines
helm upgrade --install myapp ./chart

helm rollback:
- Reverts to previous revision
- Doesn't delete current resources first
helm rollback myapp 1

Best Practice: Use helm upgrade --install in pipelines
```

**Q10: How do you manage secrets in Helm?**
```
Options:

1. Kubernetes Secrets (basic):
apiVersion: v1
kind: Secret
metadata:
  name: {{ .Release.Name }}-secret
data:
  password: {{ .Values.password | b64enc }}

2. External Secrets Operator:
- Syncs secrets from AWS Secrets Manager, Vault, etc.

3. Sealed Secrets:
- Encrypted secrets that can be stored in Git

4. Helm Secrets Plugin:
helm secrets install myapp ./chart -f secrets.yaml

5. HashiCorp Vault:
- CSI driver or sidecar injection

Best Practice: 
- Never store plain secrets in values.yaml
- Use external secret management in production
```

### ArgoCD Questions

**Q11: What is GitOps and how does ArgoCD implement it?**
```
GitOps Principles:
1. Declarative - desired state in Git
2. Versioned - Git history = deployment history
3. Automated - changes applied automatically
4. Auditable - Git commits = audit trail

ArgoCD Implementation:
1. Watches Git repositories
2. Compares desired state (Git) with actual state (cluster)
3. Syncs cluster to match Git
4. Provides visibility via UI/CLI

Flow:
Developer → Git Commit → ArgoCD Detects → Sync → Kubernetes

Benefits:
- Single source of truth
- Easy rollback (git revert)
- Audit trail
- Disaster recovery
```

**Q12: Explain ArgoCD App of Apps pattern**
```
Pattern Overview:
- One "root" Application manages other Applications
- Hierarchical organization
- Bootstrap entire clusters/environments

Structure:
argocd/
├── app-of-apps.yaml           # Root Application
└── apps/
    ├── app1.yaml              # Child Application
    ├── app2.yaml              # Child Application
    └── app3.yaml              # Child Application

Benefits:
1. Single entry point for cluster
2. Consistent configuration
3. Dependency management via sync waves
4. Easy cluster replication

Example sync waves:
annotations:
  argocd.argoproj.io/sync-wave: "1"   # CRDs first
annotations:
  argocd.argoproj.io/sync-wave: "2"   # Infrastructure
annotations:
  argocd.argoproj.io/sync-wave: "3"   # Applications
```

**Q13: How does ArgoCD handle drift detection and self-healing?**
```
Drift Detection:
- ArgoCD continuously compares Git vs Cluster state
- Any difference = "OutOfSync"
- Shows exact differences in UI

Self-Healing:
- Automatically reverts manual changes
- Ensures cluster matches Git
- Enabled via syncPolicy.automated.selfHeal: true

Configure:
syncPolicy:
  automated:
    prune: true      # Delete resources not in Git
    selfHeal: true   # Revert manual changes

Example scenario:
1. Someone manually scales deployment to 10 replicas
2. Git says 3 replicas
3. ArgoCD detects drift
4. Self-heal reverts to 3 replicas

Prevention:
- Limit RBAC access to production
- Use admission controllers
- Monitor and alert on drift
```

### SonarQube Questions

**Q14: What is a Quality Gate and how do you configure it?**
```
Quality Gate:
- Set of conditions that code must meet
- Pass/Fail decision for pipeline
- Enforces code quality standards

Default Conditions:
- No new bugs
- No new vulnerabilities
- No new security hotspots
- Coverage on new code >= 80%
- Duplications on new code <= 3%
- Maintainability rating = A

Configuration:
1. SonarQube UI → Quality Gates → Create
2. Add conditions:
   - Metric: Coverage
   - Operator: is less than
   - Error: 80%

Jenkins Integration:
timeout(time: 10, unit: 'MINUTES') {
    waitForQualityGate abortPipeline: true
}

Best Practice:
- Start with lenient gates
- Gradually tighten thresholds
- Focus on new code quality
```

---

## Real Production Scenarios

### Scenario 1: Rolling Update with Zero Downtime

**Problem**: Deploy new version without service interruption

**Solution**:
```yaml
# Deployment configuration
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1        # Can create 1 extra pod
      maxUnavailable: 0  # All pods must stay available

# Readiness probe ensures traffic only to ready pods
readinessProbe:
  httpGet:
    path: /actuator/health/readiness
    port: 8080
  initialDelaySeconds: 30
  periodSeconds: 5

# PDB prevents disruption
apiVersion: policy/v1
kind: PodDisruptionBudget
spec:
  minAvailable: 2
  selector:
    matchLabels:
      app: my-app
```

### Scenario 2: Rollback Failed Deployment

**Problem**: New deployment has critical bug

**Solution using ArgoCD**:
```bash
# Check application history
argocd app history devops-java-app-prod

# Rollback to previous version
argocd app rollback devops-java-app-prod <revision-number>

# Or via Git
git revert HEAD
git push origin main
# ArgoCD will auto-sync
```

**Solution using Helm**:
```bash
# Check release history
helm history devops-java-app -n devops-prod

# Rollback to previous
helm rollback devops-java-app 1 -n devops-prod
```

### Scenario 3: Database Migration with Deployment

**Problem**: New version requires database schema changes

**Solution using Helm hooks**:
```yaml
# migration-job.yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  annotations:
    "helm.sh/hook": pre-upgrade
    "helm.sh/hook-weight": "-5"
    "helm.sh/hook-delete-policy": hook-succeeded
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: flyway/flyway
        command: ["flyway", "migrate"]
      restartPolicy: Never
```

### Scenario 4: Blue-Green Deployment

**Problem**: Need instant rollback capability

**Solution**:
```yaml
# Blue deployment (current)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: blue

# Green deployment (new)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
      version: green

# Service (switch between blue/green)
apiVersion: v1
kind: Service
spec:
  selector:
    app: myapp
    version: blue  # Change to 'green' to switch
```

### Scenario 5: Canary Deployment

**Problem**: Test new version with small percentage of traffic

**Solution using Ingress**:
```yaml
# Canary Ingress (10% traffic)
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-canary
  annotations:
    nginx.ingress.kubernetes.io/canary: "true"
    nginx.ingress.kubernetes.io/canary-weight: "10"
spec:
  rules:
  - host: app.company.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: app-canary
            port:
              number: 80
```

---

## Troubleshooting Guide

### Jenkins Issues

**Pipeline stuck at "Waiting for executor"**
```bash
# Check Jenkins agents
kubectl get pods -n jenkins -l jenkins/agent

# Check agent configuration
# Manage Jenkins → Nodes → Configure

# Common fixes:
1. Increase agent resources
2. Add more agent templates
3. Check PodSecurityPolicy restrictions
```

**Maven dependencies failing**
```bash
# Clear Maven cache
rm -rf ~/.m2/repository

# Use Maven wrapper
./mvnw clean install

# Check proxy settings
# settings.xml → proxies section
```

### ArgoCD Issues

**Application stuck "OutOfSync"**
```bash
# Check sync status details
argocd app get devops-java-app-prod

# Check diff
argocd app diff devops-java-app-prod

# Force sync
argocd app sync devops-java-app-prod --force

# Common causes:
1. Ignore differences in HPA replicas
2. Resource field ordering
3. Helm hook resources
```

**Repository not accessible**
```bash
# Test repository access
argocd repo list

# Re-add repository
argocd repo rm https://github.com/org/repo.git
argocd repo add https://github.com/org/repo.git --username user --password token
```

### Kubernetes Issues

**Pods stuck in Pending**
```bash
# Describe pod for events
kubectl describe pod <pod-name> -n <namespace>

# Common causes:
1. Insufficient resources → scale cluster
2. Node selector no match → update labels
3. PVC not bound → check storage class
4. Image pull failed → check secrets
```

**Pods in CrashLoopBackOff**
```bash
# Check logs
kubectl logs <pod-name> -n <namespace> --previous

# Common causes:
1. Application error → fix code
2. Missing config → check ConfigMaps/Secrets
3. Database not reachable → check network policies
4. OOMKilled → increase memory limits
```

### SonarQube Issues

**Quality Gate not triggering**
```bash
# Check SonarQube webhook
# SonarQube → Administration → Configuration → Webhooks

# Verify Jenkins configuration
# Manage Jenkins → System → SonarQube servers

# Test connection
curl -u admin:password http://sonarqube:9000/api/system/status
```

---

## Quick Reference Commands

### Kubectl Commands
```bash
# Get all resources
kubectl get all -n devops-prod

# Watch pods
kubectl get pods -n devops-prod -w

# Describe resource
kubectl describe deployment devops-java-app -n devops-prod

# Get logs
kubectl logs -f deployment/devops-java-app -n devops-prod

# Execute into pod
kubectl exec -it <pod-name> -n devops-prod -- /bin/sh

# Port forward
kubectl port-forward svc/devops-java-app 8080:80 -n devops-prod
```

### Helm Commands
```bash
# Install chart
helm install devops-app ./helm/devops-java-app -n devops-dev

# Upgrade with values
helm upgrade devops-app ./helm/devops-java-app -f values-prod.yaml -n devops-prod

# List releases
helm list -A

# Get values
helm get values devops-app -n devops-prod

# Template without installing
helm template devops-app ./helm/devops-java-app
```

### ArgoCD Commands
```bash
# List applications
argocd app list

# Sync application
argocd app sync devops-java-app-prod

# Get app status
argocd app get devops-java-app-prod

# Show diff
argocd app diff devops-java-app-prod

# View logs
argocd app logs devops-java-app-prod
```

---

## File Structure Summary

```
devops-java-app/
├── src/
│   ├── main/
│   │   ├── java/com/devops/training/
│   │   │   ├── DevOpsApplication.java
│   │   │   ├── controller/
│   │   │   │   ├── ProductController.java
│   │   │   │   └── HealthController.java
│   │   │   ├── service/
│   │   │   │   └── ProductService.java
│   │   │   ├── repository/
│   │   │   │   └── ProductRepository.java
│   │   │   └── model/
│   │   │       └── Product.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── application-prod.properties
│   └── test/
│       └── java/com/devops/training/
│           └── ProductControllerTest.java
├── pom.xml
├── Dockerfile
├── .dockerignore
├── Jenkinsfile
├── helm/
│   └── devops-java-app/
│       ├── Chart.yaml
│       ├── values.yaml
│       ├── values-dev.yaml
│       ├── values-prod.yaml
│       └── templates/
│           ├── _helpers.tpl
│           ├── deployment.yaml
│           ├── service.yaml
│           ├── ingress.yaml
│           ├── hpa.yaml
│           ├── configmap.yaml
│           ├── pdb.yaml
│           ├── serviceaccount.yaml
│           ├── servicemonitor.yaml
│           └── NOTES.txt
└── argocd/
    ├── app-of-apps.yaml
    ├── apps/
    │   ├── devops-java-app-dev.yaml
    │   ├── devops-java-app-staging.yaml
    │   └── devops-java-app-prod.yaml
    ├── projects/
    │   └── production-project.yaml
    ├── applicationsets/
    │   └── multi-env-applicationset.yaml
    └── secrets/
        └── repository-secret.yaml.template
```

---

**Document End**

*This document is part of DevOps Training materials. Keep it updated with the latest versions and best practices.*
