# DevOps Tools for Kubernetes

## ⭐ SECTION 1 — Core Monitoring Stack

Let's break down each component and WHY it's required.

### 🔷 1. Prometheus (Multiple Instances)

Prometheus is the heart of metrics monitoring.

Enterprises run multiple instances:

- prometheus-app
- prometheus-system
- prometheus-database
- prometheus-platform
- prometheus-tooling
- prometheus-argos

**Why multiple?**

- workload separation
- multi-tenancy
- different retention needs
- isolation for noise reduction
- distributed scraping for scale

Prometheus stores short-term metrics (usually 12–48 hours).

### 🔷 2. Thanos (Global Metrics + Long Term Storage)

Prometheus alone cannot:

- scale beyond a single machine
- store data for months or years
- provide global querying
- deduplicate HA instances

**Thanos provides:**

- infinite retention via object storage
- global query layer across clusters
- HA Prometheus deduplication
- central governance

**Thanos components deployed:**

- Thanos Query
- Thanos Receive
- Thanos Ruler
- Thanos Store Gateway
- Thanos Multi-compact

This is mandatory for enterprise environments.

### 🔷 3. Grafana

Grafana is the visualization layer.

**Multiple Grafanas exist:**

- grafana-main → customer / ops dashboards
- grafana-read → internal dashboards
- grafana-alloy → integration dashboards
- grafana-pyroscope → profiling dashboards

**Why multiple?**

- RBAC
- isolation
- stricter access control
- dedicated dashboards for specific teams

### 🔷 4. Alertmanager

Prometheus sends alerts based on:

- CPU usage
- pod crash loops
- node pressure
- latency spikes
- business alerts

**Alertmanager handles:**

- grouping
- deduplication
- silence windows
- routing to email, Slack, PagerDuty, ServiceNow

### 🔷 5. OpenTelemetry Collector

OTel Collector is the central pipeline for all telemetry data.

**It receives:**

- logs
- metrics
- traces

**Processes them and forwards to:**

- Tempo
- Loki
- Prometheus remote-write
- SIEM systems

It replaces agents like Fluentd, Jaeger agent, etc.

### 🔷 6. Tempo

Tempo is the distributed tracing backend.

**Why needed?**

- microservices troubleshooting
- latency tracking
- root-cause analysis
- request journey visualization

Integrates with OTel, Grafana, and service mesh.

### 🔷 7. Etcd

(Not the Kubernetes ETCD cluster)

Used by monitoring components to store:

- rule configs
- state
- metadata

### 🔷 8. Exporters

Exporters turn raw system data into Prometheus metrics.

**Common exporters:**

- Node Exporter
- Kube State Metrics
- Blackbox Exporter
- MySQL/Postgres exporter
- JVM exporter
- Hardware/Platform exporters

Everything in Kubernetes is "exported" from somewhere.

### 🔷 9. ServiceNow Forwarders

These send:

- alerts
- incidents
- change events

directly into ServiceNow using the ITSM APIs.

Enterprises cannot rely on Slack or email alerts alone.

### 🔷 10. Monitoring Rules

**Includes:**

- alerting rules
- recording rules
- SLO/SLA rules
- multi-cluster aggregation rules

These rules define what is considered healthy.

---

## ⭐ SECTION 2 — Why Kubernetes Needs So Many Tools

### 🎯 Reason 1: Kubernetes is Extremely Distributed

A single app can run across:

- 10 nodes
- 20 pods
- 100 microservices

**You need:**

- metrics
- logs
- traces
- events
- profiling
- API insights

One tool cannot handle all of this.

### 🎯 Reason 2: High Availability & Multi-Cluster

Enterprises run:

- 3–10 clusters
- production + DR
- multiple Prometheus servers

You need Thanos to bring it all together.

### 🎯 Reason 3: Compliance + Retention

Banks, telcos, insurance require:

- 1–3 years of metrics
- audit trails
- secured incident history
- verified observability

Prometheus alone cannot support retention.

### 🎯 Reason 4: Enterprise Dashboards

Different teams need:

- SRE dashboards
- App dashboards
- Business dashboards
- Infra dashboards

Hence multiple Grafanas or RBAC setups.

### 🎯 Reason 5: Microservices Complexity

Distributed systems require:

- tracing
- profiling
- dependency mapping

Tools like Tempo + OTel + Pyroscope become mandatory.

---

## ⭐ SECTION 3 — Additional DevOps + Kubernetes Tools

These tools enhance the monitoring and management experience.

### 🔥 (A) Observability & Logging Tools

#### 🔷 11. Loki (Log Aggregation)

A lightweight, scalable alternative to Elasticsearch.
Designed for Kubernetes logs.
Highly recommended for cost-efficient logging.

#### 🔷 12. Pyroscope / Parca (Profiling)

Helps identify:

- CPU hotspots
- memory leaks
- slow functions

Integrated directly into Grafana.

#### 🔷 13. Fluent Bit / Fluentd

Log collectors used before sending logs to:

- Loki
- Elastic
- SIEM
- S3

### 🔥 (B) Security & Compliance Tools

#### 🔷 14. Falco

Runtime security.

**Detects:**

- suspicious process exec
- file access
- network anomalies

#### 🔷 15. Trivy

You already use this.

**Performs:**

- container image scanning
- vulnerability scanning
- IaC scanning
- SBOM generation

#### 🔷 16. Kyverno / OPA Gatekeeper

Policy enforcement for:

- security
- image signatures
- best practices

### 🔥 (C) Platform Engineering Tools

#### 🔷 17. Argo Workflows

Runs automation:

- CI/CD pipelines
- ML pipelines
- backup jobs
- cron workflows

#### 🔷 18. Argo Rollouts

Progressive delivery:

- canary
- blue-green
- shadow traffic
- A/B testing

#### 🔷 19. External Secrets Operator

Manages secrets from:

- Vault
- AWS Secrets Manager
- GCP Secret Manager
- Azure Key Vault

Avoids storing secrets in YAML.

### 🔥 (D) Backup, Storage & Reliability Tools

#### 🔷 20. Velero

Backup and restore:

- volumes
- namespaces
- resources
- clusters

#### 🔷 21. K10 (Kasten)

Enterprise backup and disaster recovery.

### 🔥 (E) Networking Tools

#### 🔷 22. Cilium

Next generation CNI with:

- eBPF networking
- network policies
- Hubble service graph
- in-built observability

#### 🔷 23. Istio / Linkerd (Service Mesh)

**Provides:**

- traffic control
- mTLS
- latency monitoring
- canary features

Combine well with Prometheus and Tempo.

### 🔥 (F) Productivity & CI/CD Tools

#### 🔷 24. Jenkins / GitHub Actions / GitLab CI

For CI, building artifacts, running tests.

#### 🔷 25. Terraform / Crossplane

- Infrastructure as Code
- Cluster provisioning
- AWS, Azure, GCP automation

---

## ⭐ SECTION 4 — Bringing Everything Together

"Why do we need 25 tools?"

Because Kubernetes is not just an orchestration engine;
it is an ecosystem that needs:

- metrics
- logs
- traces
- profiling
- policy enforcement
- security
- networking
- CI/CD
- secret management
- backups
- scaling
- troubleshooting
- compliance

This can NEVER be achieved with a single tool.

Each tool solves a very specific problem in the platform.

