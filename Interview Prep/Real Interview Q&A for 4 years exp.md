# DevOps Real Interview Q & A

### 1. What are ECS (Elastic Container Service) and ECR (Elastic Container Registry) in the context of containerization?

**ECS (Elastic Container Service)** is a fully managed container orchestration service provided by AWS that enables you to run, stop, and manage Docker containers on a cluster of EC2 instances or with AWS Fargate.

**ECR (Elastic Container Registry)** is a fully managed Docker container registry that allows developers to store, manage, and deploy container images securely and at scale.

**2 . How do I create Docker images and push them to Amazon ECR?**

**Steps:**

1. Authenticate Docker to the ECR registry:
    
    ```
    aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
    ```
    
2. Build your Docker image:
    
    ```
    docker build -t my-app .
    ```
    
3. Tag the image:
    
    ```
    docker tag my-app:latest <account-id>.dkr.ecr.<region>.amazonaws.com/my-app:latest
    ```
    
4. Push the image:
    
    ```
    docker push <account-id>.dkr.ecr.<region>.amazonaws.com/my-app:latest
    ```
    

### 3. In a multi-account setup using AWS CloudFormation, how can I create a single IAM role across all accounts?

You should use AWS CloudFormation StackSets with service-managed permissions. This allows you to create IAM roles in multiple accounts from a central management account.

Steps:

1. Define the IAM role in a CloudFormation template.
2. Use StackSet with `Service-Managed Permissions`.
3. Deploy the StackSet to the Organizational Units (OUs) or account IDs.

---

### 4. If I have a 450MB Docker image, what are the best practices to optimize and reduce its size?

- Use minimal base images (e.g., `alpine`, `distroless`).
- Remove unnecessary packages and tools.
- Use multi-stage builds.
- Minimize image layers.
- Clean cache and temporary files during build.
- Scan and analyze image with tools like `docker-slim` or `Trivy`.

---

### 5. What is the difference between Docker and Kubernetes in container orchestration?

| Feature | Docker | Kubernetes |
| --- | --- | --- |
| Scope | Container engine | Container orchestration |
| Clustering | Limited (Swarm) | Full-featured clustering |
| Scheduling | Manual/Basic | Advanced |
| Scaling | Manual or Swarm | Auto & Declarative |
| Networking | Simple bridge | Complex, cross-node support |
|  |  |  |

---

### 6. How a pod to pod communication happen in k8s ?

In Kubernetes, each Pod gets a unique IP, and all Pods can communicate directly without NAT using a flat network provided by the CNI plugin. Pod-to-Pod communication, even across nodes, works seamlessly via routable IPs. Optional NetworkPolicies can restrict this communication.

To restrict Pod-to-Pod communication in Kubernetes, you can use **NetworkPolicies**. These are Kubernetes resources that define rules to allow or deny traffic based on:

- **Pod selectors**
- **Namespaces**
- **Ingress/Egress rules**
- **Ports and IP blocks**

---

### 7. What is the difference between a container and a pod in Kubernetes?

- A **container** is a single executable unit.
- A **pod** is a logical host for one or more containers.
- Containers within a pod share IP, port space, and volume.

---

### 8. How is load balancing achieved within pods in Kubernetes?

- **Internal balancing** is done using Kubernetes Services (ClusterIP, NodePort, LoadBalancer).
- **External balancing** is done using Ingress + external Load Balancer (e.g., ALB, Nginx).
- **Round-robin** and other algorithms are applied through kube-proxy.

---

### 9. How can I fetch all EC2 instances across all AWS accounts and regions?

- Use AWS Organizations + IAM role assumption.
- Use AWS Config + AWS Config Aggregator.
- Loop through all regions and use `describe-instances`.
- Use Python/Boto3 with STS and `assume_role` to switch accounts.

---

### 10. How can I fetch all EC2 instances from all accounts within a specific AWS Organizational Unit (OU)?

- Use Organizations API to list accounts under OU.
- Assume role into each account.
- Use Boto3 to call `describe-instances`.
- Aggregate the data into a central repository (S3, DynamoDB).

---

### 11. If two VPCs in different AWS accounts have the same CIDR block, can VPC peering be established between them, and what are the alternatives?

- **No**, overlapping CIDRs are not supported in VPC peering.

**Alternatives:**

- Use **Transit Gateway** with NAT.
- Redesign one VPC CIDR if possible.
- Use **PrivateLink** for service-based access.

---

### 12. We usually see a 2/2 status check on EC2 instances; what does it mean if we now see a 3/3 status check?

This likely indicates a **custom health check** or **third-party monitoring tool**. By default, AWS only does 2 checks:

- **System status check**
- **Instance status check**

---

### 13. If an EC2 instance is hosted in the management account and we create an AMI backup, how can we share that AMI with child accounts?

- Modify AMI permissions using the CLI or Console:
    
    ```
    aws ec2 modify-image-attribute \
      --image-id ami-xxxxxxx \
      --launch-permission "Add=[{\"UserId\":\"child-account-id\"}]"
    ```
    
- Also share the associated snapshot(s).

---

### 14. After sharing an AMI with child accounts and launching the instance, it is launching and terminating automatically. What could be the reason for this behavior?

- Missing EBS snapshot permissions.
- AMI uses encrypted snapshot and key is not shared.
- Launch configuration incompatibility (e.g., unsupported instance type).
- User-data script failure.
- Security group or subnet issues.

---

### 15. How can we identify if the AMI we shared has an issue that might be causing the instance to launch and terminate automatically?

- Check EC2 console instance status and logs.
- Enable detailed monitoring.
- Use CloudTrail for AMI-related events.
- Use Systems Manager > Session Manager (if enabled).
- Review CloudWatch Logs or Serial Console output.

---

### 16. What are the steps involved in configuring a 3-tier architecture in AWS?

1. **Presentation Layer:**
    - ALB + Auto Scaling Group (ASG) of EC2 or ECS services.
2. **Application Layer:**
    - Internal ASG or ECS.
    - Private subnets.
3. **Database Layer:**
    - RDS or Aurora.
    - Multi-AZ for high availability.
4. Use VPC, Security Groups, and Subnet separation.

---

### 17. If we are trying to download or save an RDS backup to an S3 bucket but RDS is not connecting to S3, how can we troubleshoot this issue?

- Ensure RDS has correct IAM role attached with `AmazonS3FullAccess` or specific bucket permissions.
- Check that the bucket is in the same region.
- VPC Endpoint for S3 if using VPC-only RDS.
- Verify bucket policy allows access from RDS.
- Enable enhanced logging.