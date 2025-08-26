# DevOps Advanced Interview Q & A

## **Advanced Kubernetes**

**1. Multi-cluster Service Discovery**

> Scenario: You have two Kubernetes clusters in different regions. Services in cluster A need to communicate with services in cluster B without exposing them publicly. How would you achieve this?
> 
- Use **service mesh** like Istio or Linkerd with multi-cluster setup.
- Use **VPN or VPC peering** for network connectivity.
- Configure **externalName services or DNS federation**.

**2. Rolling Update with StatefulSet in Production**

> Scenario: You have a StatefulSet running a critical database in production. You need to perform a rolling update to a new image version without losing data or availability. During the update, one pod fails to become ready. How would you handle this?
> 
- Check pod events using `kubectl describe pod <pod>` for failure reasons.
- Inspect PVCs and ensure volume attachments are correct.
- Pause the rollout, fix the underlying issue (like readiness probe failure or storage limits), then resume using `kubectl rollout resume statefulset/<name>`.
- Validate database cluster health before continuing.

**3. Complex Pod Scheduling Constraints**

> Scenario: You need to deploy a critical pod that requires GPU, specific node labels, and must avoid nodes with multiple taints. Only a few nodes satisfy all conditions, and the pod remains Pending. How would you resolve this?
> 
- Check node resources and labels: `kubectl get nodes --show-labels`.
- Inspect taints and tolerations.
- Adjust `nodeSelector`, `tolerations`, or `affinity` to correctly target eligible nodes.
- Consider temporarily removing non-critical taints or scaling cluster with additional compliant nodes.

**4. Kubernetes Networking Bottleneck**

> Scenario: Pods in the same namespace have high latency. Network policies are applied. How would you troubleshoot?
> 
- Inspect **CNI plugin metrics** (Calico, Flannel, etc.).
- Check `kubectl describe networkpolicy` and verify allowed traffic.
- Use `tcpdump` inside pods to trace packet drops.

**Advanced Docker**

**5. Multi-Stage Build with Secret Handling**

> Scenario: Your Docker build requires API keys but you don’t want them in the final image. How would you securely pass secrets?
> 
- Use `-build-arg` with ephemeral secrets.
- Use **Docker BuildKit** with `-secret` feature.
- Ensure no secrets are written into final layers.

**6. Docker Swarm/Compose Scaling Issue**

> Scenario: Your service scales in Docker Compose but new containers fail due to port conflicts. How do you fix it?
> 
- Use **dynamic port mapping** in Compose.
- Check for overlapping published ports across services.
- Use **overlay networks** for container-to-container communication.

---

## **Advanced Terraform**

**7. Complex Multi-Account AWS Setup**

> Scenario: You need to deploy a VPC in multiple AWS accounts with shared resources like IAM roles and S3 buckets. How do you structure Terraform?
> 
- Use **Terraform workspaces or separate state files** per account.
- Use **remote state with cross-account access**.
- Manage IAM roles for **assume-role** between accounts.

**8. Terraform Resource Dependencies**

> Scenario: Your resources fail to deploy due to implicit dependency issues. How do you solve it?
> 
- Use `depends_on` explicitly for complex resources.
- Ensure modules propagate outputs correctly.
- Check for **circular dependencies** in modules.

**9. Managing Drift in Large Environments**

> Scenario: In a 100+ resource AWS environment, manual changes are frequent. How do you detect and reconcile drift?
> 
- Use `terraform plan -refresh-only`.
- Implement **policy-as-code** with Sentinel or Open Policy Agent.
- Automate drift detection via CI/CD pipelines.

---

## **Advanced Ansible**

**10. Dynamic Inventory for Hybrid Cloud**

> Scenario: You have a mix of AWS, Azure, and on-prem servers. You need dynamic inventory for playbooks. How do you set it up?
> 
- Use **cloud dynamic inventory plugins** (`aws_ec2`, `azure_rm`).
- Cache inventory for speed and consistency.
- Handle tagging for environment-specific deployments.

**11. Zero-Downtime Deployment**

> Scenario: Rolling update of 50+ web servers without downtime. How do you structure Ansible playbook?
> 
- Use `serial` and `max_fail_percentage` in playbooks.
- Validate health after each batch with **handlers**.
- Integrate with load balancer to **drain traffic** before update.

**12. Ansible Vault in CI/CD**

> Scenario: Secrets need to be deployed securely in CI/CD pipelines. How do you manage them with Ansible Vault?
> 
- Encrypt secrets with `ansible-vault encrypt_string`.
- Use vault password in CI/CD securely (GitHub Actions secret, Jenkins credential).
- Avoid storing vault passwords in repo or logs.

---

## **Advanced AWS**

**13. Multi-AZ RDS Failover with Minimal Downtime**

> Scenario: You need zero-downtime failover for RDS MySQL across AZs. How do you configure it?
> 
- Enable **Multi-AZ deployment**.
- Use **read replicas** for scaling read traffic.
- Test failover by simulating AZ failure.

**14. Lambda Scaling Bottleneck**

> Scenario: Your Lambda function processing S3 events throttles under high load. How do you troubleshoot?
> 
- Check **concurrent execution limits**.
- Use **SQS or Kinesis** to buffer events.
- Optimize code for execution time to reduce cold starts.

**15. Cross-Region CI/CD Deployment**

> Scenario: Deploying infrastructure and code to multiple regions automatically with Terraform and CodePipeline. How do you implement?
> 
- Use **Terraform modules** with region variables.
- Implement **CodePipeline with multi-region stages**.
- Ensure **state management** is consistent using remote backend.