### Introduction

Prometheus is an open-source monitoring system widely used to collect and store time-series metrics from Kubernetes clusters, applications, and infrastructure.

### PART 1 — What is Prometheus?

Prometheus is a pull-based monitoring system that collects metrics from:

- Kubernetes components
- Nodes
- Pods
- Applications
- Exporters

It stores data in time-series format and provides PromQL for querying metrics.

### PART 2 — Install Prometheus on Kubernetes using Helm

**Step 1 — Create Namespace**

```bash
kubectl create namespace monitoring
```

**Step 2 — Add Prometheus Helm Repository**

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

**Step 3 — Install `kube-prometheus-stack`**

This installs:

- Prometheus
- Alertmanager
- Grafana
- Node Exporter
- Kube-State-Metrics

```bash
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring
```

### PART 3 — Verify Installation

List all pods in the `monitoring` namespace:

```bash
kubectl get pods -n monitoring
```

Expected pods:

- `prometheus-kube-prometheus-prometheus-0`
- `prometheus-kube-prometheus-operator-xxxx`
- `prometheus-grafana-xxxx`

### PART 4 — How Prometheus Scrapes Kubernetes Metrics

Prometheus automatically discovers Kubernetes components through:

- `ServiceMonitor`
- `PodMonitor`
- Node Exporter
- `kube-state-metrics`
- API server
- Etcd
- Kubelet

No manual configuration is needed because `kube-prometheus-stack` provides default scraping configs.

### PART 5 — Access Prometheus Dashboard (Port Forwarding)

Use this command to port-forward Prometheus:

```bash
kubectl port-forward --address 0.0.0.0 -n monitoring svc/prometheus-kube-prometheus-prometheus 9090:9090
```

Then open Prometheus in your browser:

```text
http://<your-node-ip>:9090
```

### PART 6 — PromQL Queries

**CPU usage (all containers)**

```promql
container_cpu_usage_seconds_total
```

**Node CPU usage**

```promql
rate(node_cpu_seconds_total{mode!="idle"}[5m])
```

**Pod CPU usage**

```promql
rate(container_cpu_usage_seconds_total{image!=""}[5m])
```

**Node memory used**

```promql
node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes
```

**Kubelet health**

```promql
up{job="kubelet"}
```

### PART 7 — Access Grafana Dashboard

**Step 1 — Port Forward Grafana**

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Open Grafana in your browser:

```text
http://<your-node-ip>:3000
```

**Step 2 — Get Grafana Admin Password**

```bash
kubectl get secret -n monitoring prometheus-grafana -o jsonpath="{.data.admin-password}" | base64 --decode
```

**Step 3 — Built-in Dashboards**

Inside Grafana → Dashboards → Browse, you will find dashboards such as:

- `Kubernetes / Compute Resources / Cluster`
- `Kubernetes / API Server`
- `Nodes`
- `Pods`

These are great for visualization and YouTube demos.

### PART 8 — Cleanup

```bash
helm uninstall prometheus -n monitoring
kubectl delete ns monitoring
```
