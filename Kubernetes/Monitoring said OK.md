# 📉 Monitoring Said OK… Users Said NO 😡

A practical demonstration of why infrastructure metrics can show "OK" while users experience performance issues, and how to monitor the right metrics.

---

## 🛠️ Demo

### 🟢 STEP 1: Deploy the application

```bash
kubectl create deployment slow-app --image=nginx
```

---

### 🟢 STEP 2: Expose the app

```bash
kubectl expose deployment slow-app --port=80 --type=NodePort
```
```bash
kubectl get svc slow-app

```
---

### 🟢 STEP 3: Access the app

**Get Node IP:**

```bash
kubectl get nodes -o wide
```

**Test:**

```bash
curl http://<NODE-IP>:<NODE-PORT>
```
### Install Metrics Server
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

kubectl edit deployment metrics-server -n kube-system

containers:
- name: metrics-server
  args:


- --kubelet-insecure-tls
- --kubelet-preferred-address-types=InternalIP


```

---

### 🟢 STEP 4: Install curl inside the pod

```bash
kubectl exec -it deploy/slow-app -- /bin/sh
```

```bash
apt update
apt install -y curl
```

**Verify:**

```bash
curl localhost
```

---

### 🔴 STEP 5: Introduce REAL latency

```bash
kubectl exec -it deploy/slow-app -- /bin/sh
```

**Modify nginx configuration:**

```bash
sed -i 's/index  index.html index.htm;/index  index.html index.htm;\n        add_header X-Demo "Slow App";\n        proxy_read_timeout 10s;/' /etc/nginx/nginx.conf
```

**Restart nginx:**

```bash
nginx -s reload
```

**Now simulate delay:**

```bash
while true; do
  sleep 3
done
```

---

### 🟢 STEP 6: Show Kubernetes metrics

```bash
kubectl top pods
```

---

## 🧠 STEP 7: THE PROBLEM

### ❌ Why infra metrics fail

| Metric | Looks OK | User Impact |
|--------|----------|-------------|
| **CPU** | ✅ | ❌ |
| **Memory** | ✅ | ❌ |
| **Disk** | ✅ | ❌ |

> ⚠️ **Key Insight:** Infrastructure metrics (CPU, Memory, Disk) can all look healthy while users experience slow response times and poor performance.

---

## 🔴 STEP 8: Average vs p95

**The Problem:**

- **Average latency:** 200ms
- **p95 latency:** 3.5 seconds

> 🎯 **Critical:** Looking at average metrics can be misleading. The p95 (95th percentile) tells you what most users actually experience, not the average.

---

## 🟢 STEP 9: The RIGHT metrics

### Golden Signals

Monitor these four key metrics instead of just infrastructure metrics:

1. **Latency** — How long it takes to serve a request
2. **Traffic** — How much demand is being placed on your system
3. **Errors** — Rate of requests that fail
4. **Saturation** — How "full" your service is

> 📊 **Golden Signals Framework:** These metrics, defined by Google's SRE team, focus on user-facing performance rather than infrastructure health.

---

## 🟢 STEP 10: SLOs

**Service Level Objective Example:**

```
99% requests < 500ms
```

> 🎯 **This is how you measure happiness, not CPU.**

**What SLOs Provide:**

- Clear, measurable targets for service performance
- User-focused metrics that matter to your business
- A way to align engineering work with user experience

---

## 🟢 STEP 11: Error Budgets

**Key Concepts:**

- **Error budget** = allowed failure
- **Burn rate** high = stop releases

**How it works:**

- When error budget is consumed too quickly (high burn rate), stop deploying new features
- Focus on fixing reliability issues before adding new functionality
- Protects user experience while allowing innovation

> 🔥 **Burn Rate:** Measures how quickly your error budget is being consumed. High burn rate means you're failing too often relative to your SLO.

---

## 🎯 Key Takeaways

1. **Infrastructure metrics ≠ User experience**
   - CPU, Memory, and Disk can all be OK while users suffer

2. **Monitor p95, not just averages**
   - Average latency hides the pain felt by most users

3. **Use Golden Signals**
   - Latency, Traffic, Errors, Saturation tell the real story

4. **Implement SLOs**
   - Measure user happiness, not infrastructure health

5. **Respect Error Budgets**
   - Stop deploying when burn rate is high
   - Focus on reliability over features

---

> 📊 **Remember:** When the monitor says "OK" but users say "NO," you're monitoring the wrong metrics!

