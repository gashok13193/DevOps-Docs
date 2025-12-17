🚨 I Deleted a Kubernetes Namespace in Production 😨


WHAT HAPPENS INSIDE KUBERNETES

Step 1: Namespace marked for deletion
kubectl get ns payments -o yaml


status:
  phase: Terminating


Step 2: All resources are marked for deletion

Explain cascade:

Pods

Deployments

Services

ConfigMaps

Secrets

Ingress

HPA

PDB

Step 3: Finalizers slow everything down

kubectl create ns payments


kubectl create deployment web --image=nginx -n payments
kubectl expose deployment web --port=80 -n payments

kubectl get all -n payments


kubectl get pods -n payments -o yaml | grep finalizers

finalizers:

```
apiVersion: v1
kind: ConfigMap
metadata:
  name: prod-config
  namespace: payments
  finalizers:
    - kubernetes
data:
  env: prod
```
kubectl apply -f finalizer.yaml

kubectl delete ns payments

kubectl get ns payments


kubectl get all -n payments

kubectl get pods -n payments

WHAT USERS EXPERIENCE

For users:

502 / 503 errors

Blank pages

Payment failures

App unavailable

For monitoring:

Error rate spike

Latency p99 explodes

Alerts firing nonstop

For Kafka / async systems:

Consumers crash

Offsets stop committing

Backlog increases


CAN ARGOCD SAVE YOU?

Scenario 1: Namespace is Git-managed

If ArgoCD manages the namespace itself:

kind: Namespace
metadata:
  name: payments

Then:

ArgoCD will try to recreate it

But ❌ resources are still gone

Scenario 2: ArgoCD auto-sync enabled

Namespace recreated

Deployments recreated

Pods start coming up

But:

Secrets may be missing

PVCs may not bind

External resources lost


HOW DO YOU RECOVER (REAL WORLD)

✅ Recovery Option 1: GitOps Redeploy (Best case)

Steps:

Recreate namespace

Sync ArgoCD

Verify workloads

Recreate secrets

kubectl create ns payments
argocd app sync payments-app


Works only if:

Everything is in Git

Secrets are external (Vault, AWS SM)

⚠️ Recovery Option 2: PVC & Data Recovery

If PVCs were deleted:

Data is GONE

Only snapshots can help

Explain:

EBS snapshots

CSI snapshots

Backup tools (Velero)

🔥 Hard truth:

Kubernetes does NOT back up your data by default.

❌ Recovery Option 3: Manual recreation (Worst)

Recreate secrets

Reconfigure ingress

Reattach DNS

Restart integrations

This can take hours.

HOW TO PREVENT THIS FOREVER
1️⃣ Use RBAC properly
verbs: ["get", "list"]


❌ No delete for humans

2️⃣ Disable namespace deletion

Admission controllers:

OPA Gatekeeper

Kyverno

Rule:

Block delete namespace if label = prod

3️⃣ Separate kubeconfig contexts
kubectl config use-context prod


Use:

Red terminal

Loud prompt

4️⃣ SRE Rule

Humans should NOT have delete access in production.
