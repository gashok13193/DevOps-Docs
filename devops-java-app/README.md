# DevOps Java Application - CI/CD Training Project

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://jenkins.company.com)
[![Code Quality](https://img.shields.io/badge/quality-A-brightgreen)](https://sonarqube.company.com)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://hub.docker.com)
[![Kubernetes](https://img.shields.io/badge/kubernetes-ready-blue)](https://kubernetes.io)
[![ArgoCD](https://img.shields.io/badge/argocd-managed-orange)](https://argoproj.github.io/argo-cd/)

## 📋 Overview

A complete, production-ready DevOps training project demonstrating end-to-end CI/CD pipeline implementation with:

- **Java Spring Boot Application** - RESTful API with best practices
- **Jenkins Pipeline** - Complete CI pipeline with all stages
- **SonarQube Integration** - Code quality and security analysis
- **Artifactory** - Artifact management
- **Docker** - Containerization with multi-stage builds
- **Kubernetes** - Container orchestration
- **Helm Charts** - Kubernetes package management
- **ArgoCD** - GitOps-based continuous deployment
- **App of Apps Pattern** - Enterprise deployment strategy

## 🏗️ Project Structure

```
devops-java-app/
├── src/                          # Java source code
│   ├── main/java/               # Application code
│   └── test/java/               # Test code
├── helm/                         # Helm charts
│   └── devops-java-app/
│       ├── templates/           # Kubernetes manifests
│       ├── values.yaml          # Default values
│       ├── values-dev.yaml      # Development values
│       └── values-prod.yaml     # Production values
├── argocd/                       # ArgoCD configurations
│   ├── app-of-apps.yaml         # Root application
│   ├── apps/                    # Child applications
│   ├── projects/                # AppProjects
│   └── applicationsets/         # ApplicationSets
├── Jenkinsfile                   # CI Pipeline definition
├── Dockerfile                    # Container build instructions
├── pom.xml                       # Maven configuration
├── COMPLETE_SETUP_GUIDE.md       # Full setup documentation
└── INTERVIEW_QUESTIONS.md        # Interview preparation
```

## 🚀 Quick Start

### Prerequisites

- Java 17+
- Maven 3.9+
- Docker 24+
- Kubernetes cluster
- kubectl configured
- Helm 3.13+
- ArgoCD CLI

### Build the Application

```bash
# Clone repository
git clone https://github.com/your-org/devops-java-app.git
cd devops-java-app

# Build with Maven
mvn clean package

# Run locally
java -jar target/devops-java-app.jar
```

### Build Docker Image

```bash
# Build image
docker build -t devops-java-app:latest .

# Run container
docker run -p 8080:8080 devops-java-app:latest
```

### Deploy with Helm

```bash
# Install to development
helm install devops-app ./helm/devops-java-app \
  -n devops-dev \
  -f helm/devops-java-app/values-dev.yaml

# Install to production
helm install devops-app ./helm/devops-java-app \
  -n devops-prod \
  -f helm/devops-java-app/values-prod.yaml
```

### Deploy with ArgoCD

```bash
# Apply App of Apps
kubectl apply -f argocd/app-of-apps.yaml

# Sync application
argocd app sync devops-java-app-dev
```

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/products` | GET | List all products |
| `/api/v1/products/{id}` | GET | Get product by ID |
| `/api/v1/products` | POST | Create product |
| `/api/v1/products/{id}` | PUT | Update product |
| `/api/v1/products/{id}` | DELETE | Delete product |
| `/api/health` | GET | Health check |
| `/api/info` | GET | Application info |
| `/actuator/prometheus` | GET | Prometheus metrics |
| `/swagger-ui.html` | GET | API documentation |

## 🔄 CI/CD Pipeline

### Pipeline Stages

```
┌──────────────────────────────────────────────────────────────────┐
│                        CI PIPELINE                                │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│   Git    │  Build   │  Test    │  Sonar   │  Docker  │  Deploy  │
│ Checkout │  Maven   │  JUnit   │  Quality │  Build   │  ArgoCD  │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
```

1. **Git Checkout** - Clone source code
2. **Build** - Maven compile
3. **Unit Tests** - JUnit + JaCoCo coverage
4. **SonarQube** - Code quality analysis
5. **Quality Gate** - Pass/fail decision
6. **Package** - Create JAR artifact
7. **Artifactory** - Upload artifact
8. **Docker Build** - Create container image
9. **Security Scan** - Trivy vulnerability scan
10. **Docker Push** - Push to registry
11. **Update Helm** - GitOps trigger

## 📊 Monitoring

### Health Endpoints

- **Liveness**: `/actuator/health/liveness`
- **Readiness**: `/actuator/health/readiness`
- **Metrics**: `/actuator/prometheus`

### Grafana Dashboards

- JVM Metrics Dashboard
- Application Metrics Dashboard
- Kubernetes Pod Dashboard

## 📚 Documentation

- [Complete Setup Guide](COMPLETE_SETUP_GUIDE.md) - Full infrastructure setup
- [Interview Questions](INTERVIEW_QUESTIONS.md) - DevOps interview preparation
- [API Documentation](http://localhost:8080/swagger-ui.html) - Swagger UI

## 🎓 Interview Topics Covered

- **CI/CD Concepts** - Pipeline stages, GitOps
- **Jenkins** - Pipeline as code, shared libraries
- **Docker** - Multi-stage builds, best practices
- **Kubernetes** - Deployments, Services, Ingress
- **Helm** - Charts, values, hooks
- **ArgoCD** - Sync policies, App of Apps
- **SonarQube** - Quality gates, metrics
- **Security** - Container security, secrets management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- DevOps Training Team

---

**Happy Learning! 🚀**
