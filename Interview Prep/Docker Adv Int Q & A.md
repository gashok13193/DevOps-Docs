### 1. **Scenario: Zero-Downtime Upgrade**

👉 You are running a production API in Docker. You need to upgrade the container image with **zero downtime**. How do you do it?

**Answer:**

- Run **two containers** (old & new version) behind a reverse proxy (Nginx/Traefik).
- Start new version container, health-check it.
- Switch proxy traffic to new container.
- Stop old container after confirmation.
- Orchestrate with **Docker Swarm rolling updates** or Kubernetes.
    
     Shows knowledge of **blue-green/canary deployments**, key in production systems.
    

---

### 2. **Scenario: Container Logs Growing Too Large**

👉 Your container’s log files on the host reach **100GB** and fill disk. How do you prevent this?

**Answer:**

- Configure log driver with rotation:
    
    ```yaml
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "3"
    
    ```
    
- Or use external log drivers (`fluentd`, `gelf`, `awslogs`).
    
     Log growth is a real-world **Docker host stability issue**. Candidates must know log driver tuning.
    

---

### 3. **Scenario: Debugging Networking in Multi-Host Setup**

👉 Two containers are on different Docker hosts, but need to communicate directly. How do you solve this?

**Answer:**

- Use **Docker Swarm overlay network**:
    
    ```bash
    docker network create -d overlay my-overlay
    
    ```
    
- Deploy services attached to overlay → DNS resolution works across nodes.
- Or use external networking (Calico/Weave).
    
     Shows awareness of **multi-node container networking** beyond the single host.
    

---

### 4. **Scenario: Image Drift Between Dev & Prod**

👉 Your app works in **Dev container**, but in **Prod container** it fails with missing libraries. Why?

**Answer:**

- Likely Dev was using cached layers / local files not included in Dockerfile.
- Use `.dockerignore` properly to avoid copying junk.
- Always build from **clean context** (CI/CD pipeline).
    
     Prevents **“works on my machine”** syndrome.
    

---

### 5. **Scenario: Secrets Management**

👉 You need to pass DB passwords to a container securely. What’s the best approach?

**Answer:**

- Avoid hardcoding in Dockerfile or ENV.
- Use `docker secret` (Swarm) or external secret stores (Vault, AWS SSM, K8s Secrets).
- Example with Swarm:
    
    ```bash
    echo "mypassword" | docker secret create db_pass -
    
    ```
    

 Secure secret management is critical in DevOps pipelines.

---

### 6. **Scenario: Multi-Architecture Images**

👉 You want your image to run on **ARM (Raspberry Pi)** and **x86 (servers)**. How do you build it?

**Answer:**

- Use `docker buildx` for multi-arch builds:
    
    ```bash
    docker buildx build --platform linux/amd64,linux/arm64 -t myapp:latest .
    
    ```
    

 Multi-arch images are essential for hybrid cloud + IoT workloads.

---

### 7. **Scenario: High CPU Usage Inside Container**

👉 A container consumes **100% CPU** and affects other workloads. How do you control it?

**Answer:**

- Use CPU limits:
    
    ```bash
    docker run --cpus="1.5" myapp
    
    ```
    
- Use `docker stats` to monitor usage.
    
     Containers without resource limits can starve the host → production killer.
    

---

### 8. **Scenario: Layer Caching Not Working in CI/CD**

👉 Your Docker builds are **always slow** in CI/CD, no cache is used. How do you fix?

**Answer:**

- Use `-cache-from` in builds with remote cache:
    
    ```bash
    docker build --cache-from myapp:latest -t myapp:ci .
    
    ```
    
- Reorder Dockerfile to maximize cache (dependencies first, code later).
    
     Efficient builds = faster pipelines, less cost.
    

---

### 9. **Scenario: App Crashes on `docker-compose up`, Works in `docker run`**

👉 Why could this happen?

**Answer:**

- Different network setup → `compose` creates its own network.
- Missing env vars in `docker-compose.yml`.
- Volume mounts overwrite container files.
    
     Shows understanding of differences between `docker run` vs `docker-compose`.
    

---

### 10. **Scenario: Rootless Containers for Security**

👉 Security team asks you to avoid root inside containers. How do you enforce this?

**Answer:**

- Add a non-root user in Dockerfile:
    
    ```docker
    RUN useradd -m appuser
    USER appuser
    
    ```
    
- Or run container rootless with `-user` flag.
    
     Security best practice → no root privileges inside containers.