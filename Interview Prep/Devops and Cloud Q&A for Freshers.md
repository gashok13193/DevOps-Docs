# DevOps and Cloud Q&A (0 -1 year)

## 🔧 **DevOps Interview Q&A**

### 1. **What is CI/CD, and why is it important?**

**Answer:**

CI (Continuous Integration) is the practice of integrating code changes frequently into a shared repository with automated testing.

CD (Continuous Deployment/Delivery) ensures code is automatically delivered or deployed after passing CI stages.

✅ It improves collaboration, detects issues early, and speeds up delivery.

---

### 2. **How does Jenkins work? What are pipelines?**

**Answer:**

Jenkins is a CI/CD tool that automates building, testing, and deploying applications.

Pipelines are scripted or declarative steps written in a Jenkinsfile that define the full CI/CD workflow.

---

### 3. **How do you handle secrets in Jenkins?**

**Answer:**

Use **Jenkins credentials plugin** to store secrets securely, and access them in the pipeline using environment variables or credentials blocks.

---

### 4. **What’s the difference between `git pull` and `git fetch`?**

**Answer:**

- `git fetch` downloads changes but doesn’t merge.
- `git pull` = `fetch` + `merge`, so your local branch is updated.

---

### 5. **What is a Git rebase, and when would you use it?**

**Answer:**

Rebase rewrites commits to create a linear history.

Use it to clean up feature branch history **before merging** to `main`.

---

### 6. **What’s the difference between an image and a container in Docker?**

**Answer:**

- **Image** = blueprint (static)
- **Container** = running instance of the image (dynamic)

---

### 7. **How do you persist data in Docker?**

**Answer:**

Use **volumes** or **bind mounts** to store data outside the container filesystem.

---

### 8. **What is the difference between COPY and ADD in Dockerfile?**

**Answer:**

Both copy files into the image, but `ADD` can also handle URLs and extract `.tar` files. Prefer `COPY` for simplicity and clarity.

---

### 9. **How do you scale a Kubernetes deployment?**

**Answer:**

Use `kubectl scale` or modify `.spec.replicas` in the deployment YAML.

```bash
bash

kubectl scale deployment my-app --replicas=5

```

---

### 10. **What is a ConfigMap vs a Secret in Kubernetes?**

**Answer:**

- ConfigMap: stores **non-sensitive** config data.
- Secret: stores **sensitive** data like passwords, base64 encoded.

---

### 11. **What’s a rolling update in Kubernetes?**

**Answer:**

A way to update pods gradually with zero downtime. Old pods are terminated one-by-one while new ones come up.

---

### 12. **How do you debug a failed Kubernetes pod?**

**Answer:**

- Check pod status: `kubectl get pods`
- View logs: `kubectl logs pod-name`
- Describe events: `kubectl describe pod pod-name`

---

## ☁️ **Cloud (AWS) Interview Q&A**

### 13. **What is EC2?**

**Answer:**

EC2 (Elastic Compute Cloud) provides resizable virtual servers (instances) in the cloud to run applications.

---

### 14. **What is a Security Group in AWS?**

**Answer:**

A virtual firewall that controls inbound/outbound traffic for EC2 instances at the instance level.

---

### 15. **What is the difference between S3 and EBS?**

**Answer:**

- **S3**: Object storage, accessible over the web (HTTP/HTTPS)
- **EBS**: Block storage, attached to EC2 for file systems

---

### 16. **How do you list EC2 instances using AWS CLI?**

**Answer:**

```bash

aws ec2 describe-instances --query "Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress]" --output table

```

---

### 17. **What is IAM and why is it important?**

**Answer:**

IAM (Identity and Access Management) allows fine-grained control over who can access which AWS resources. It provides users, roles, and policies for secure access.

---

### 18. **What is an Availability Zone vs a Region?**

**Answer:**

- Region = a physical area (e.g., ap-south-1)
- AZ = a datacenter within a region
    
    High availability apps span **multiple AZs**.
    

---

### 19. **What is CloudFormation?**

**Answer:**

An AWS service to define and provision infrastructure using **YAML/JSON templates** (Infrastructure as Code).

---

### 20. **What is VPC and why is it used?**

**Answer:**

VPC (Virtual Private Cloud) allows you to create a private, isolated network in AWS. You define subnets, route tables, gateways, etc.

---

## 

### 21. **How does pod-to-pod communication happen in Kubernetes?**

**Answer:**

Pods use the **cluster network (CNI plugin)**, where each pod gets a unique IP, and DNS service (CoreDNS) helps resolve pod/service names.

---

### 22. **How do you restrict access between namespaces?**

**Answer:**

Use **NetworkPolicies** to define rules about which pods/services can talk across namespaces.

---

### 23. **How does Terraform handle state?**

**Answer:**

It keeps a `.tfstate` file to track the current state of resources. For team use, store state remotely (e.g., S3 + DynamoDB locking).

---

### 24. **How do blue-green deployments work?**

**Answer:**

Two identical environments:

- Blue (current live)
- Green (new version)
    
    You switch traffic to green after testing, and roll back to blue if needed.