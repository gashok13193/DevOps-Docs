# Kubernetes Troubleshooting Guide

## 1) POD STUCK IN PENDING

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: pending-pod
spec:
  containers:
  - name: nginx
    image: nginx:1.23
  nodeSelector:
    disktype: ssd
```

## 2) IMAGEPULLBACKOFF

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: imagepull-pod
spec:
  containers:
  - name: app
    image: nginx:nonexistent-tag-1234
```

## 3) CRASHLOOPBACKOFF

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: crash-pod
spec:
  containers:
  - name: crash
    image: busybox:1.36
    command: ["/bin/sh","-c"]
    args: ["echo 'start'; sleep 1; exit 1"]
```

## 4) OOMKILLED

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: oom-pod
spec:
  containers:
  - name: mem-eater
    image: python:3.9-slim
    command: ["python","-c"]
    args: ["a = 'x' * (100 * 1024 * 1024); import time; time.sleep(3600)"]
    resources:
      limits:
        memory: "64Mi"
      requests:
        memory: "64Mi"
```

## 5) PVC STUCK IN PENDING

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: data-pvc
spec:
  accessModes:
  - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: nonexistent-sc
```

## 6) SERVICE NOT ACCESSIBLE

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web
spec:
  replicas: 1
  selector:
    matchLabels:
      app: web
  template:
    metadata:
      labels:
        app: web
    spec:
      containers:
      - name: web
        image: hashicorp/http-echo:0.2.3
        args:
          - "-text=hello"
        ports:
        - containerPort: 8080
```

```yaml
apiVersion: v1
kind: Service
metadata:
  name: web-svc
spec:
  selector:
    app: web
  ports:
  - protocol: TCP
    port: 80
    targetPort: 9090
  type: ClusterIP
```
