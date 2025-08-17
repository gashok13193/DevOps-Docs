# pip install pyyaml

import yaml
import sys
import subprocess

# python yaml_automation.py  deploy.yaml image

#Argument validation

if len(sys.argv) !=4:
    print("Usage: python <yaml_automation.py>  <deploy.yaml> <image> <deploy_name>")
    sys.exit(1)
    
# Read the yaml file

yaml_file = sys.argv[1]
new_image = sys.argv[2]
depl_name = sys.argv[3]

with open(yaml_file, 'r') as f:
    data = yaml.safe_load(f)
    
data['spec']['template']['spec']['containers'][0]['image'] = new_image

data['metadata']['name'] = depl_name

with open(yaml_file, 'w') as f:
    yaml.safe_dump(data, f)
    
print(f"Updated the deployment name to {new_image} and also update the deplyment {depl_name}")

subprocess.run(["kubectl","apply", "-f", "yaml_file"])

subprocess.run(["kubectl", "rollout", "status", f"deployment/{data['metadata']['name']}" ])