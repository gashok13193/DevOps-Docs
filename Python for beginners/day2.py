import subprocess
# variables and data types

namespace = "prod"
app = "nginx-ashok"
replicas = 6
image = "nginx:latest"


yaml = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {app}
  namespace : {namespace}
spec:
  replicas: {replicas}
  selector:
    matchLabels:
      app: {app}
  template:
    metadata:
      labels:
        app: {app}
    spec:
      containers:
      - name: {app}
        image: {image}
"""

with open("deployment.yaml", "w") as f:
    f.write(yaml)
=====================================================

import subprocess

def create_deployment(app, namespace, replicas, image):
    yaml_file = f"{app}-deployment.yaml"
    yaml = f"""
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {app}
  namespace: {namespace}
spec:
  replicas: {replicas}
  selector:
    matchLabels:
      app: {app}
  template:
    metadata:
      labels:
        app: {app}
    spec:
      containers:
      - name: {app}
        image: {image}
"""
    with open(yaml_file, "w") as f:
        f.write(yaml)
    
    subprocess.run(["kubectl", "apply", "-f", yaml_file])
    print(f"Deployment applied for {app} in {namespace}")

create_deployment("nginx", "prod", 3, "nginx:latest")
