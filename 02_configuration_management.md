# Configuration Management with Python for DevOps

## Table of Contents
1. [YAML and JSON Processing](#yaml-and-json-processing)
2. [Infrastructure as Code (IaC)](#infrastructure-as-code-iac)
3. [Configuration Management Tools](#configuration-management-tools)
4. [Best Practices](#best-practices)

## YAML and JSON Processing

### Advanced YAML Operations

**DevOps Usage Scenario**: Managing complex application configurations, Kubernetes manifests, and CI/CD pipeline definitions.

```python
import yaml
import json
import jsonschema
from typing import Dict, Any, List, Optional
from pathlib import Path
import os
from jinja2 import Environment, FileSystemLoader, DictLoader
from dataclasses import dataclass, asdict
import logging

# Configuration data classes for type safety
@dataclass
class DatabaseConfig:
    host: str
    port: int
    name: str
    username: str
    password: str
    ssl_enabled: bool = True
    connection_pool_size: int = 10

@dataclass
class ApplicationConfig:
    name: str
    version: str
    environment: str
    debug: bool
    database: DatabaseConfig
    redis_url: str
    secret_key: str
    allowed_hosts: List[str]

class ConfigurationManager:
    """Advanced configuration management with validation and templating"""
    
    def __init__(self, config_dir: str = "configs"):
        self.config_dir = Path(config_dir)
        self.config_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        
        # YAML loader that preserves order and handles custom tags
        yaml.add_constructor('!env', self._env_constructor)
        yaml.add_constructor('!file', self._file_constructor)
        yaml.add_constructor('!base64', self._base64_constructor)
    
    def _env_constructor(self, loader, node):
        """Custom YAML constructor for environment variables"""
        env_var = loader.construct_scalar(node)
        parts = env_var.split(':', 1)
        env_name = parts[0]
        default_value = parts[1] if len(parts) > 1 else None
        
        value = os.getenv(env_name, default_value)
        if value is None:
            raise ValueError(f"Environment variable {env_name} not found")
        return value
    
    def _file_constructor(self, loader, node):
        """Custom YAML constructor for file contents"""
        file_path = loader.construct_scalar(node)
        try:
            with open(file_path, 'r') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise ValueError(f"File {file_path} not found")
    
    def _base64_constructor(self, loader, node):
        """Custom YAML constructor for base64 decoding"""
        import base64
        encoded_value = loader.construct_scalar(node)
        return base64.b64decode(encoded_value).decode('utf-8')
    
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration from YAML file with custom constructors"""
        config_path = self.config_dir / config_file
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            self.logger.info(f"Loaded configuration from {config_path}")
            return config
        except Exception as e:
            self.logger.error(f"Failed to load config from {config_path}: {e}")
            raise
    
    def load_config_with_includes(self, config_file: str) -> Dict[str, Any]:
        """Load configuration with support for includes"""
        config = self.load_config(config_file)
        
        # Process includes
        if 'includes' in config:
            for include_file in config['includes']:
                include_config = self.load_config(include_file)
                config = self._deep_merge(config, include_config)
            del config['includes']
        
        return config
    
    def _deep_merge(self, base: Dict[str, Any], override: Dict[str, Any]) -> Dict[str, Any]:
        """Deep merge two dictionaries"""
        result = base.copy()
        for key, value in override.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._deep_merge(result[key], value)
            else:
                result[key] = value
        return result
    
    def validate_config(self, config: Dict[str, Any], schema: Dict[str, Any]) -> bool:
        """Validate configuration against JSON schema"""
        try:
            jsonschema.validate(config, schema)
            self.logger.info("Configuration validation passed")
            return True
        except jsonschema.ValidationError as e:
            self.logger.error(f"Configuration validation failed: {e.message}")
            raise ValueError(f"Invalid configuration: {e.message}")
    
    def save_config(self, config: Dict[str, Any], config_file: str) -> None:
        """Save configuration to YAML file"""
        config_path = self.config_dir / config_file
        try:
            with open(config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False, sort_keys=False)
            self.logger.info(f"Saved configuration to {config_path}")
        except Exception as e:
            self.logger.error(f"Failed to save config to {config_path}: {e}")
            raise

# Configuration schema definitions
APPLICATION_SCHEMA = {
    "type": "object",
    "properties": {
        "name": {"type": "string"},
        "version": {"type": "string", "pattern": r"^\d+\.\d+\.\d+$"},
        "environment": {"type": "string", "enum": ["development", "staging", "production"]},
        "debug": {"type": "boolean"},
        "database": {
            "type": "object",
            "properties": {
                "host": {"type": "string"},
                "port": {"type": "integer", "minimum": 1, "maximum": 65535},
                "name": {"type": "string"},
                "username": {"type": "string"},
                "password": {"type": "string"},
                "ssl_enabled": {"type": "boolean"},
                "connection_pool_size": {"type": "integer", "minimum": 1}
            },
            "required": ["host", "port", "name", "username", "password"]
        },
        "redis_url": {"type": "string"},
        "secret_key": {"type": "string"},
        "allowed_hosts": {
            "type": "array",
            "items": {"type": "string"}
        }
    },
    "required": ["name", "version", "environment", "database"]
}

# Environment-specific configuration templates
class ConfigTemplateManager:
    """Manage configuration templates for different environments"""
    
    def __init__(self, template_dir: str = "templates"):
        self.template_dir = Path(template_dir)
        self.template_dir.mkdir(exist_ok=True)
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            trim_blocks=True,
            lstrip_blocks=True
        )
    
    def render_config(self, template_name: str, variables: Dict[str, Any]) -> str:
        """Render configuration template with variables"""
        template = self.jinja_env.get_template(template_name)
        return template.render(**variables)
    
    def generate_config_for_environment(self, 
                                      environment: str, 
                                      base_config: Dict[str, Any]) -> Dict[str, Any]:
        """Generate environment-specific configuration"""
        env_overrides = {
            'development': {
                'debug': True,
                'database': {
                    'host': 'localhost',
                    'port': 5432,
                    'ssl_enabled': False
                },
                'redis_url': 'redis://localhost:6379/0'
            },
            'staging': {
                'debug': False,
                'database': {
                    'host': 'staging-db.example.com',
                    'port': 5432,
                    'ssl_enabled': True
                },
                'redis_url': 'redis://staging-redis.example.com:6379/0'
            },
            'production': {
                'debug': False,
                'database': {
                    'host': 'prod-db.example.com',
                    'port': 5432,
                    'ssl_enabled': True,
                    'connection_pool_size': 20
                },
                'redis_url': 'redis://prod-redis.example.com:6379/0'
            }
        }
        
        if environment not in env_overrides:
            raise ValueError(f"Unknown environment: {environment}")
        
        # Deep merge base config with environment overrides
        config_manager = ConfigurationManager()
        return config_manager._deep_merge(base_config, env_overrides[environment])

# Kubernetes configuration management
class KubernetesConfigManager:
    """Manage Kubernetes configurations with Python"""
    
    def __init__(self, namespace: str = "default"):
        self.namespace = namespace
        self.logger = logging.getLogger(__name__)
    
    def create_deployment_config(self, 
                               app_name: str, 
                               image: str, 
                               replicas: int = 1,
                               resources: Dict[str, Any] = None,
                               env_vars: Dict[str, str] = None) -> Dict[str, Any]:
        """Create Kubernetes deployment configuration"""
        
        resources = resources or {
            'requests': {'cpu': '100m', 'memory': '128Mi'},
            'limits': {'cpu': '500m', 'memory': '512Mi'}
        }
        
        env_vars = env_vars or {}
        
        deployment = {
            'apiVersion': 'apps/v1',
            'kind': 'Deployment',
            'metadata': {
                'name': app_name,
                'namespace': self.namespace,
                'labels': {
                    'app': app_name
                }
            },
            'spec': {
                'replicas': replicas,
                'selector': {
                    'matchLabels': {
                        'app': app_name
                    }
                },
                'template': {
                    'metadata': {
                        'labels': {
                            'app': app_name
                        }
                    },
                    'spec': {
                        'containers': [{
                            'name': app_name,
                            'image': image,
                            'ports': [{'containerPort': 8080}],
                            'resources': resources,
                            'env': [{'name': k, 'value': v} for k, v in env_vars.items()]
                        }]
                    }
                }
            }
        }
        
        return deployment
    
    def create_service_config(self, 
                            app_name: str, 
                            port: int = 80, 
                            target_port: int = 8080,
                            service_type: str = 'ClusterIP') -> Dict[str, Any]:
        """Create Kubernetes service configuration"""
        
        service = {
            'apiVersion': 'v1',
            'kind': 'Service',
            'metadata': {
                'name': f"{app_name}-service",
                'namespace': self.namespace,
                'labels': {
                    'app': app_name
                }
            },
            'spec': {
                'selector': {
                    'app': app_name
                },
                'ports': [{
                    'port': port,
                    'targetPort': target_port,
                    'protocol': 'TCP'
                }],
                'type': service_type
            }
        }
        
        return service
    
    def create_configmap(self, 
                        name: str, 
                        data: Dict[str, str],
                        binary_data: Dict[str, bytes] = None) -> Dict[str, Any]:
        """Create Kubernetes ConfigMap"""
        
        configmap = {
            'apiVersion': 'v1',
            'kind': 'ConfigMap',
            'metadata': {
                'name': name,
                'namespace': self.namespace
            },
            'data': data
        }
        
        if binary_data:
            import base64
            configmap['binaryData'] = {
                k: base64.b64encode(v).decode('utf-8') 
                for k, v in binary_data.items()
            }
        
        return configmap
    
    def save_manifests(self, manifests: List[Dict[str, Any]], output_dir: str) -> None:
        """Save Kubernetes manifests to files"""
        output_path = Path(output_dir)
        output_path.mkdir(exist_ok=True)
        
        for manifest in manifests:
            kind = manifest.get('kind', 'unknown')
            name = manifest.get('metadata', {}).get('name', 'unnamed')
            filename = f"{kind.lower()}-{name}.yaml"
            
            with open(output_path / filename, 'w') as f:
                yaml.dump(manifest, f, default_flow_style=False)
            
            self.logger.info(f"Saved {kind} manifest: {filename}")

# Example usage scenarios
def main():
    # Example 1: Application configuration management
    config_manager = ConfigurationManager()
    
    # Base application configuration
    base_config = {
        'name': 'my-app',
        'version': '1.0.0',
        'database': {
            'name': 'myapp_db',
            'username': 'app_user',
            'password': '!env DATABASE_PASSWORD:default_password'
        },
        'secret_key': '!env SECRET_KEY',
        'allowed_hosts': ['localhost', '127.0.0.1']
    }
    
    # Generate environment-specific configurations
    template_manager = ConfigTemplateManager()
    
    for env in ['development', 'staging', 'production']:
        env_config = template_manager.generate_config_for_environment(env, base_config)
        env_config['environment'] = env
        
        # Validate configuration
        config_manager.validate_config(env_config, APPLICATION_SCHEMA)
        
        # Save configuration
        config_manager.save_config(env_config, f"app-{env}.yaml")
        print(f"Generated configuration for {env}")
    
    # Example 2: Kubernetes manifest generation
    k8s_manager = KubernetesConfigManager(namespace="production")
    
    # Create deployment
    deployment = k8s_manager.create_deployment_config(
        app_name="web-app",
        image="nginx:1.20",
        replicas=3,
        resources={
            'requests': {'cpu': '200m', 'memory': '256Mi'},
            'limits': {'cpu': '1000m', 'memory': '1Gi'}
        },
        env_vars={
            'ENV': 'production',
            'DEBUG': 'false'
        }
    )
    
    # Create service
    service = k8s_manager.create_service_config(
        app_name="web-app",
        port=80,
        target_port=8080,
        service_type="LoadBalancer"
    )
    
    # Create ConfigMap
    app_config = {
        'database_url': 'postgresql://user:pass@db:5432/myapp',
        'redis_url': 'redis://redis:6379/0',
        'log_level': 'info'
    }
    
    configmap = k8s_manager.create_configmap(
        name="web-app-config",
        data={k: str(v) for k, v in app_config.items()}
    )
    
    # Save all manifests
    manifests = [deployment, service, configmap]
    k8s_manager.save_manifests(manifests, "k8s-manifests")
    
    print("Generated Kubernetes manifests")

if __name__ == "__main__":
    main()
```

## Infrastructure as Code (IaC)

### Terraform Integration with Python

**DevOps Usage Scenario**: Managing Terraform configurations, state files, and automating infrastructure deployments.

```python
import subprocess
import json
import os
from typing import Dict, Any, List, Optional
from pathlib import Path
import tempfile
from dataclasses import dataclass, asdict
import logging

@dataclass
class TerraformResource:
    """Base class for Terraform resources"""
    resource_type: str
    resource_name: str
    provider: str = "aws"

@dataclass
class EC2Instance(TerraformResource):
    """EC2 instance resource"""
    ami: str
    instance_type: str
    key_name: Optional[str] = None
    vpc_security_group_ids: Optional[List[str]] = None
    subnet_id: Optional[str] = None
    tags: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        self.resource_type = "aws_instance"

@dataclass
class S3Bucket(TerraformResource):
    """S3 bucket resource"""
    bucket_name: str
    acl: str = "private"
    versioning_enabled: bool = True
    tags: Optional[Dict[str, str]] = None
    
    def __post_init__(self):
        self.resource_type = "aws_s3_bucket"

class TerraformManager:
    """Manage Terraform operations with Python"""
    
    def __init__(self, working_dir: str = "terraform"):
        self.working_dir = Path(working_dir)
        self.working_dir.mkdir(exist_ok=True)
        self.logger = logging.getLogger(__name__)
        self.state_file = self.working_dir / "terraform.tfstate"
    
    def generate_provider_config(self, providers: Dict[str, Dict[str, Any]]) -> str:
        """Generate Terraform provider configuration"""
        config_lines = ['terraform {', '  required_providers {']
        
        for provider, settings in providers.items():
            config_lines.append(f'    {provider} = {{')
            for key, value in settings.items():
                if isinstance(value, str):
                    config_lines.append(f'      {key} = "{value}"')
                else:
                    config_lines.append(f'      {key} = {json.dumps(value)}')
            config_lines.append('    }')
        
        config_lines.extend(['  }', '}', ''])
        
        # Add provider blocks
        for provider in providers.keys():
            config_lines.extend([
                f'provider "{provider}" {{',
                '  # Configuration options',
                '}',
                ''
            ])
        
        return '\n'.join(config_lines)
    
    def generate_resource_config(self, resources: List[TerraformResource]) -> str:
        """Generate Terraform resource configuration"""
        config_lines = []
        
        for resource in resources:
            config_lines.append(
                f'resource "{resource.resource_type}" "{resource.resource_name}" {{'
            )
            
            # Convert dataclass to dict and filter out None values
            resource_dict = asdict(resource)
            resource_dict = {k: v for k, v in resource_dict.items() 
                           if v is not None and k not in ['resource_type', 'resource_name', 'provider']}
            
            for key, value in resource_dict.items():
                if isinstance(value, str):
                    config_lines.append(f'  {key} = "{value}"')
                elif isinstance(value, bool):
                    config_lines.append(f'  {key} = {str(value).lower()}')
                elif isinstance(value, list):
                    config_lines.append(f'  {key} = {json.dumps(value)}')
                elif isinstance(value, dict):
                    config_lines.append(f'  {key} = {{')
                    for sub_key, sub_value in value.items():
                        if isinstance(sub_value, str):
                            config_lines.append(f'    {sub_key} = "{sub_value}"')
                        else:
                            config_lines.append(f'    {sub_key} = {json.dumps(sub_value)}')
                    config_lines.append('  }')
                else:
                    config_lines.append(f'  {key} = {value}')
            
            config_lines.extend(['}', ''])
        
        return '\n'.join(config_lines)
    
    def generate_variables(self, variables: Dict[str, Dict[str, Any]]) -> str:
        """Generate Terraform variables configuration"""
        config_lines = []
        
        for var_name, var_config in variables.items():
            config_lines.append(f'variable "{var_name}" {{')
            
            for key, value in var_config.items():
                if isinstance(value, str):
                    config_lines.append(f'  {key} = "{value}"')
                else:
                    config_lines.append(f'  {key} = {json.dumps(value)}')
            
            config_lines.extend(['}', ''])
        
        return '\n'.join(config_lines)
    
    def generate_outputs(self, outputs: Dict[str, Dict[str, str]]) -> str:
        """Generate Terraform outputs configuration"""
        config_lines = []
        
        for output_name, output_config in outputs.items():
            config_lines.append(f'output "{output_name}" {{')
            
            for key, value in output_config.items():
                config_lines.append(f'  {key} = {value}')
            
            config_lines.extend(['}', ''])
        
        return '\n'.join(config_lines)
    
    def write_terraform_files(self, 
                            providers: Dict[str, Dict[str, Any]],
                            resources: List[TerraformResource],
                            variables: Dict[str, Dict[str, Any]] = None,
                            outputs: Dict[str, Dict[str, str]] = None) -> None:
        """Write Terraform configuration files"""
        
        # Main configuration file
        main_config = self.generate_provider_config(providers) + '\n'
        main_config += self.generate_resource_config(resources)
        
        with open(self.working_dir / "main.tf", 'w') as f:
            f.write(main_config)
        
        # Variables file
        if variables:
            variables_config = self.generate_variables(variables)
            with open(self.working_dir / "variables.tf", 'w') as f:
                f.write(variables_config)
        
        # Outputs file
        if outputs:
            outputs_config = self.generate_outputs(outputs)
            with open(self.working_dir / "outputs.tf", 'w') as f:
                f.write(outputs_config)
        
        self.logger.info("Generated Terraform configuration files")
    
    def terraform_init(self) -> subprocess.CompletedProcess:
        """Initialize Terraform"""
        return self._run_terraform_command(['init'])
    
    def terraform_plan(self, var_file: str = None) -> subprocess.CompletedProcess:
        """Run Terraform plan"""
        cmd = ['plan']
        if var_file:
            cmd.extend(['-var-file', var_file])
        return self._run_terraform_command(cmd)
    
    def terraform_apply(self, var_file: str = None, auto_approve: bool = False) -> subprocess.CompletedProcess:
        """Apply Terraform configuration"""
        cmd = ['apply']
        if var_file:
            cmd.extend(['-var-file', var_file])
        if auto_approve:
            cmd.append('-auto-approve')
        return self._run_terraform_command(cmd)
    
    def terraform_destroy(self, var_file: str = None, auto_approve: bool = False) -> subprocess.CompletedProcess:
        """Destroy Terraform-managed infrastructure"""
        cmd = ['destroy']
        if var_file:
            cmd.extend(['-var-file', var_file])
        if auto_approve:
            cmd.append('-auto-approve')
        return self._run_terraform_command(cmd)
    
    def terraform_output(self, output_name: str = None) -> Dict[str, Any]:
        """Get Terraform outputs"""
        cmd = ['output', '-json']
        if output_name:
            cmd.append(output_name)
        
        result = self._run_terraform_command(cmd)
        if result.returncode == 0:
            return json.loads(result.stdout)
        else:
            raise RuntimeError(f"Failed to get Terraform output: {result.stderr}")
    
    def get_state(self) -> Dict[str, Any]:
        """Get current Terraform state"""
        if self.state_file.exists():
            with open(self.state_file, 'r') as f:
                return json.load(f)
        return {}
    
    def _run_terraform_command(self, cmd: List[str]) -> subprocess.CompletedProcess:
        """Run Terraform command"""
        full_cmd = ['terraform'] + cmd
        
        self.logger.info(f"Running: {' '.join(full_cmd)}")
        
        result = subprocess.run(
            full_cmd,
            cwd=self.working_dir,
            capture_output=True,
            text=True
        )
        
        if result.returncode != 0:
            self.logger.error(f"Terraform command failed: {result.stderr}")
        else:
            self.logger.info("Terraform command completed successfully")
        
        return result

# CloudFormation integration
class CloudFormationManager:
    """Manage AWS CloudFormation with Python"""
    
    def __init__(self):
        import boto3
        self.cf_client = boto3.client('cloudformation')
        self.logger = logging.getLogger(__name__)
    
    def generate_template(self, 
                         resources: Dict[str, Dict[str, Any]],
                         parameters: Dict[str, Dict[str, Any]] = None,
                         outputs: Dict[str, Dict[str, str]] = None) -> Dict[str, Any]:
        """Generate CloudFormation template"""
        
        template = {
            'AWSTemplateFormatVersion': '2010-09-09',
            'Description': 'Generated CloudFormation template',
            'Resources': resources
        }
        
        if parameters:
            template['Parameters'] = parameters
        
        if outputs:
            template['Outputs'] = outputs
        
        return template
    
    def create_stack(self, 
                    stack_name: str, 
                    template: Dict[str, Any],
                    parameters: List[Dict[str, str]] = None,
                    tags: List[Dict[str, str]] = None) -> str:
        """Create CloudFormation stack"""
        
        kwargs = {
            'StackName': stack_name,
            'TemplateBody': json.dumps(template),
            'Capabilities': ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
        }
        
        if parameters:
            kwargs['Parameters'] = parameters
        
        if tags:
            kwargs['Tags'] = tags
        
        response = self.cf_client.create_stack(**kwargs)
        stack_id = response['StackId']
        
        self.logger.info(f"Created CloudFormation stack: {stack_name} ({stack_id})")
        return stack_id
    
    def update_stack(self, 
                    stack_name: str, 
                    template: Dict[str, Any],
                    parameters: List[Dict[str, str]] = None) -> str:
        """Update CloudFormation stack"""
        
        kwargs = {
            'StackName': stack_name,
            'TemplateBody': json.dumps(template),
            'Capabilities': ['CAPABILITY_IAM', 'CAPABILITY_NAMED_IAM']
        }
        
        if parameters:
            kwargs['Parameters'] = parameters
        
        response = self.cf_client.update_stack(**kwargs)
        stack_id = response['StackId']
        
        self.logger.info(f"Updated CloudFormation stack: {stack_name}")
        return stack_id
    
    def delete_stack(self, stack_name: str) -> None:
        """Delete CloudFormation stack"""
        self.cf_client.delete_stack(StackName=stack_name)
        self.logger.info(f"Initiated deletion of CloudFormation stack: {stack_name}")
    
    def get_stack_status(self, stack_name: str) -> str:
        """Get CloudFormation stack status"""
        response = self.cf_client.describe_stacks(StackName=stack_name)
        return response['Stacks'][0]['StackStatus']
    
    def wait_for_stack_completion(self, stack_name: str, operation: str = 'create') -> bool:
        """Wait for stack operation to complete"""
        import time
        
        success_statuses = {
            'create': 'CREATE_COMPLETE',
            'update': 'UPDATE_COMPLETE',
            'delete': 'DELETE_COMPLETE'
        }
        
        failed_statuses = {
            'create': ['CREATE_FAILED', 'ROLLBACK_COMPLETE'],
            'update': ['UPDATE_FAILED', 'UPDATE_ROLLBACK_COMPLETE'],
            'delete': ['DELETE_FAILED']
        }
        
        target_status = success_statuses[operation]
        fail_statuses = failed_statuses[operation]
        
        while True:
            try:
                status = self.get_stack_status(stack_name)
                self.logger.info(f"Stack {stack_name} status: {status}")
                
                if status == target_status:
                    return True
                elif status in fail_statuses:
                    return False
                
                time.sleep(30)  # Wait 30 seconds before checking again
                
            except Exception as e:
                if operation == 'delete' and 'does not exist' in str(e):
                    return True  # Stack successfully deleted
                self.logger.error(f"Error checking stack status: {e}")
                return False

# Pulumi integration
class PulumiManager:
    """Manage Pulumi infrastructure with Python"""
    
    def __init__(self, project_name: str, stack_name: str):
        self.project_name = project_name
        self.stack_name = stack_name
        self.logger = logging.getLogger(__name__)
    
    def create_pulumi_project(self, 
                            template: str = "aws-python",
                            project_dir: str = None) -> str:
        """Create new Pulumi project"""
        if project_dir is None:
            project_dir = self.project_name
        
        os.makedirs(project_dir, exist_ok=True)
        
        # Create Pulumi.yaml
        pulumi_config = {
            'name': self.project_name,
            'runtime': 'python',
            'description': f'Infrastructure for {self.project_name}'
        }
        
        pulumi_yaml_path = Path(project_dir) / "Pulumi.yaml"
        with open(pulumi_yaml_path, 'w') as f:
            yaml.dump(pulumi_config, f)
        
        # Create requirements.txt
        requirements = [
            'pulumi>=3.0.0,<4.0.0',
            'pulumi-aws>=4.0.0,<5.0.0'
        ]
        
        requirements_path = Path(project_dir) / "requirements.txt"
        with open(requirements_path, 'w') as f:
            f.write('\n'.join(requirements))
        
        self.logger.info(f"Created Pulumi project: {self.project_name}")
        return project_dir
    
    def generate_main_program(self, resources: List[Dict[str, Any]]) -> str:
        """Generate main Pulumi program"""
        
        program_lines = [
            'import pulumi',
            'import pulumi_aws as aws',
            '',
        ]
        
        for resource in resources:
            resource_type = resource['type']
            resource_name = resource['name']
            resource_args = resource.get('args', {})
            
            program_lines.append(f'{resource_name} = aws.{resource_type}(')
            program_lines.append(f'    "{resource_name}",')
            
            for key, value in resource_args.items():
                if isinstance(value, str):
                    program_lines.append(f'    {key}="{value}",')
                else:
                    program_lines.append(f'    {key}={value},')
            
            program_lines.append(')')
            program_lines.append('')
        
        # Add exports
        program_lines.append('# Exports')
        for resource in resources:
            resource_name = resource['name']
            program_lines.append(f'pulumi.export("{resource_name}_id", {resource_name}.id)')
        
        return '\n'.join(program_lines)

# Example usage
def example_terraform_usage():
    """Example of using TerraformManager"""
    
    # Create Terraform manager
    tf_manager = TerraformManager("./terraform-example")
    
    # Define providers
    providers = {
        'aws': {
            'source': 'hashicorp/aws',
            'version': '~> 4.0'
        }
    }
    
    # Define resources
    resources = [
        EC2Instance(
            resource_name="web_server",
            ami="ami-0abcdef1234567890",
            instance_type="t3.micro",
            tags={"Name": "WebServer", "Environment": "production"}
        ),
        S3Bucket(
            resource_name="app_bucket",
            bucket_name="my-app-bucket-unique-name",
            acl="private",
            tags={"Purpose": "Application Storage"}
        )
    ]
    
    # Define variables
    variables = {
        'region': {
            'description': 'AWS region',
            'type': 'string',
            'default': 'us-east-1'
        },
        'environment': {
            'description': 'Environment name',
            'type': 'string'
        }
    }
    
    # Define outputs
    outputs = {
        'instance_id': {
            'value': 'aws_instance.web_server.id',
            'description': 'EC2 instance ID'
        },
        'bucket_name': {
            'value': 'aws_s3_bucket.app_bucket.bucket',
            'description': 'S3 bucket name'
        }
    }
    
    # Generate Terraform files
    tf_manager.write_terraform_files(providers, resources, variables, outputs)
    
    # Initialize and plan
    tf_manager.terraform_init()
    tf_manager.terraform_plan()
    
    print("Terraform configuration generated and planned successfully")

if __name__ == "__main__":
    example_terraform_usage()
```

## Configuration Management Tools

### Ansible Integration

**DevOps Usage Scenario**: Automating server configuration, application deployment, and infrastructure management using Ansible with Python.

```python
import yaml
import json
import subprocess
from typing import Dict, Any, List, Optional
from pathlib import Path
import tempfile
import logging
from dataclasses import dataclass, asdict

@dataclass
class AnsibleTask:
    """Represents an Ansible task"""
    name: str
    module: str
    args: Dict[str, Any]
    when: Optional[str] = None
    tags: Optional[List[str]] = None
    become: Optional[bool] = None
    register: Optional[str] = None

@dataclass 
class AnsiblePlay:
    """Represents an Ansible play"""
    name: str
    hosts: str
    tasks: List[AnsibleTask]
    vars: Optional[Dict[str, Any]] = None
    become: Optional[bool] = None
    gather_facts: Optional[bool] = None

class AnsibleManager:
    """Manage Ansible operations with Python"""
    
    def __init__(self, inventory_file: str = "inventory.ini"):
        self.inventory_file = inventory_file
        self.logger = logging.getLogger(__name__)
        self.playbooks_dir = Path("playbooks")
        self.playbooks_dir.mkdir(exist_ok=True)
    
    def create_inventory(self, inventory: Dict[str, Any]) -> str:
        """Create Ansible inventory file"""
        inventory_lines = []
        
        # Process groups
        for group_name, group_data in inventory.items():
            if group_name == '_meta':
                continue
                
            inventory_lines.append(f"[{group_name}]")
            
            if isinstance(group_data, dict):
                hosts = group_data.get('hosts', [])
                vars_dict = group_data.get('vars', {})
                
                # Add hosts
                for host in hosts:
                    if isinstance(host, dict):
                        host_line = host['name']
                        host_vars = host.get('vars', {})
                        for key, value in host_vars.items():
                            host_line += f" {key}={value}"
                        inventory_lines.append(host_line)
                    else:
                        inventory_lines.append(host)
                
                # Add group variables
                if vars_dict:
                    inventory_lines.append(f"[{group_name}:vars]")
                    for key, value in vars_dict.items():
                        inventory_lines.append(f"{key}={value}")
            
            inventory_lines.append("")
        
        inventory_content = "\n".join(inventory_lines)
        
        with open(self.inventory_file, 'w') as f:
            f.write(inventory_content)
        
        self.logger.info(f"Created inventory file: {self.inventory_file}")
        return inventory_content
    
    def create_playbook(self, plays: List[AnsiblePlay], playbook_name: str) -> str:
        """Create Ansible playbook from play objects"""
        playbook_data = []
        
        for play in plays:
            play_dict = {
                'name': play.name,
                'hosts': play.hosts,
                'tasks': []
            }
            
            if play.vars:
                play_dict['vars'] = play.vars
            if play.become is not None:
                play_dict['become'] = play.become
            if play.gather_facts is not None:
                play_dict['gather_facts'] = play.gather_facts
            
            # Add tasks
            for task in play.tasks:
                task_dict = {
                    'name': task.name,
                    task.module: task.args
                }
                
                if task.when:
                    task_dict['when'] = task.when
                if task.tags:
                    task_dict['tags'] = task.tags
                if task.become is not None:
                    task_dict['become'] = task.become
                if task.register:
                    task_dict['register'] = task.register
                
                play_dict['tasks'].append(task_dict)
            
            playbook_data.append(play_dict)
        
        playbook_content = yaml.dump(playbook_data, default_flow_style=False)
        playbook_path = self.playbooks_dir / f"{playbook_name}.yml"
        
        with open(playbook_path, 'w') as f:
            f.write(playbook_content)
        
        self.logger.info(f"Created playbook: {playbook_path}")
        return str(playbook_path)
    
    def run_playbook(self, 
                    playbook_path: str, 
                    inventory: str = None,
                    extra_vars: Dict[str, Any] = None,
                    tags: List[str] = None,
                    limit: str = None,
                    check_mode: bool = False) -> subprocess.CompletedProcess:
        """Run Ansible playbook"""
        
        cmd = ['ansible-playbook']
        
        # Add inventory
        if inventory:
            cmd.extend(['-i', inventory])
        elif self.inventory_file:
            cmd.extend(['-i', self.inventory_file])
        
        # Add extra variables
        if extra_vars:
            extra_vars_json = json.dumps(extra_vars)
            cmd.extend(['--extra-vars', extra_vars_json])
        
        # Add tags
        if tags:
            cmd.extend(['--tags', ','.join(tags)])
        
        # Add limit
        if limit:
            cmd.extend(['--limit', limit])
        
        # Add check mode
        if check_mode:
            cmd.append('--check')
        
        # Add playbook path
        cmd.append(playbook_path)
        
        self.logger.info(f"Running: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )
        
        if result.returncode == 0:
            self.logger.info("Playbook execution completed successfully")
        else:
            self.logger.error(f"Playbook execution failed: {result.stderr}")
        
        return result
    
    def run_ad_hoc_command(self, 
                          hosts: str, 
                          module: str, 
                          args: str = "",
                          inventory: str = None,
                          become: bool = False) -> subprocess.CompletedProcess:
        """Run ad-hoc Ansible command"""
        
        cmd = ['ansible']
        
        # Add inventory
        if inventory:
            cmd.extend(['-i', inventory])
        elif self.inventory_file:
            cmd.extend(['-i', self.inventory_file])
        
        # Add become
        if become:
            cmd.append('--become')
        
        # Add hosts and module
        cmd.extend([hosts, '-m', module])
        
        # Add module arguments
        if args:
            cmd.extend(['-a', args])
        
        self.logger.info(f"Running ad-hoc command: {' '.join(cmd)}")
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True
        )
        
        return result

class ApplicationDeploymentManager:
    """Manage application deployments with Ansible"""
    
    def __init__(self, ansible_manager: AnsibleManager):
        self.ansible_manager = ansible_manager
        self.logger = logging.getLogger(__name__)
    
    def create_web_app_deployment(self, 
                                 app_name: str,
                                 app_version: str,
                                 git_repo: str,
                                 app_port: int = 8080,
                                 environment: str = "production") -> str:
        """Create web application deployment playbook"""
        
        # Define tasks for web app deployment
        tasks = [
            AnsibleTask(
                name="Install required packages",
                module="package",
                args={
                    "name": ["git", "python3", "python3-pip", "nginx"],
                    "state": "present"
                },
                become=True
            ),
            AnsibleTask(
                name="Create application user",
                module="user",
                args={
                    "name": app_name,
                    "system": True,
                    "shell": "/bin/bash",
                    "home": f"/opt/{app_name}"
                },
                become=True
            ),
            AnsibleTask(
                name="Clone application repository",
                module="git",
                args={
                    "repo": git_repo,
                    "dest": f"/opt/{app_name}/app",
                    "version": app_version,
                    "force": True
                },
                become=True,
                register="git_clone"
            ),
            AnsibleTask(
                name="Install Python dependencies",
                module="pip",
                args={
                    "requirements": f"/opt/{app_name}/app/requirements.txt",
                    "virtualenv": f"/opt/{app_name}/venv",
                    "virtualenv_python": "python3"
                },
                become=True
            ),
            AnsibleTask(
                name="Create application configuration",
                module="template",
                args={
                    "src": "app_config.j2",
                    "dest": f"/opt/{app_name}/app/config.py",
                    "owner": app_name,
                    "group": app_name,
                    "mode": "0644"
                },
                become=True
            ),
            AnsibleTask(
                name="Create systemd service file",
                module="template",
                args={
                    "src": "app_service.j2",
                    "dest": f"/etc/systemd/system/{app_name}.service",
                    "mode": "0644"
                },
                become=True,
                register="service_file"
            ),
            AnsibleTask(
                name="Reload systemd daemon",
                module="systemd",
                args={
                    "daemon_reload": True
                },
                become=True,
                when="service_file.changed"
            ),
            AnsibleTask(
                name="Start and enable application service",
                module="systemd",
                args={
                    "name": app_name,
                    "state": "started",
                    "enabled": True
                },
                become=True
            ),
            AnsibleTask(
                name="Configure Nginx reverse proxy",
                module="template",
                args={
                    "src": "nginx_site.j2",
                    "dest": f"/etc/nginx/sites-available/{app_name}",
                    "mode": "0644"
                },
                become=True,
                register="nginx_config"
            ),
            AnsibleTask(
                name="Enable Nginx site",
                module="file",
                args={
                    "src": f"/etc/nginx/sites-available/{app_name}",
                    "dest": f"/etc/nginx/sites-enabled/{app_name}",
                    "state": "link"
                },
                become=True
            ),
            AnsibleTask(
                name="Restart Nginx",
                module="systemd",
                args={
                    "name": "nginx",
                    "state": "restarted"
                },
                become=True,
                when="nginx_config.changed"
            )
        ]
        
        # Create play
        play = AnsiblePlay(
            name=f"Deploy {app_name} application",
            hosts="web_servers",
            tasks=tasks,
            vars={
                "app_name": app_name,
                "app_version": app_version,
                "app_port": app_port,
                "environment": environment
            },
            become=False,
            gather_facts=True
        )
        
        # Create playbook
        playbook_path = self.ansible_manager.create_playbook(
            [play], 
            f"deploy_{app_name}"
        )
        
        return playbook_path
    
    def create_database_setup(self, 
                            db_type: str = "postgresql",
                            db_name: str = "appdb",
                            db_user: str = "appuser",
                            db_password: str = "changeme") -> str:
        """Create database setup playbook"""
        
        if db_type == "postgresql":
            tasks = [
                AnsibleTask(
                    name="Install PostgreSQL",
                    module="package",
                    args={
                        "name": ["postgresql", "postgresql-contrib", "python3-psycopg2"],
                        "state": "present"
                    },
                    become=True
                ),
                AnsibleTask(
                    name="Start PostgreSQL service",
                    module="systemd",
                    args={
                        "name": "postgresql",
                        "state": "started",
                        "enabled": True
                    },
                    become=True
                ),
                AnsibleTask(
                    name="Create database",
                    module="postgresql_db",
                    args={
                        "name": db_name,
                        "state": "present"
                    },
                    become=True,
                    become_user="postgres"
                ),
                AnsibleTask(
                    name="Create database user",
                    module="postgresql_user",
                    args={
                        "name": db_user,
                        "password": db_password,
                        "priv": f"{db_name}:ALL",
                        "state": "present"
                    },
                    become=True,
                    become_user="postgres"
                )
            ]
        elif db_type == "mysql":
            tasks = [
                AnsibleTask(
                    name="Install MySQL",
                    module="package",
                    args={
                        "name": ["mysql-server", "python3-pymysql"],
                        "state": "present"
                    },
                    become=True
                ),
                AnsibleTask(
                    name="Start MySQL service",
                    module="systemd",
                    args={
                        "name": "mysql",
                        "state": "started",
                        "enabled": True
                    },
                    become=True
                ),
                AnsibleTask(
                    name="Create database",
                    module="mysql_db",
                    args={
                        "name": db_name,
                        "state": "present"
                    },
                    become=True
                ),
                AnsibleTask(
                    name="Create database user",
                    module="mysql_user",
                    args={
                        "name": db_user,
                        "password": db_password,
                        "priv": f"{db_name}.*:ALL",
                        "state": "present"
                    },
                    become=True
                )
            ]
        else:
            raise ValueError(f"Unsupported database type: {db_type}")
        
        play = AnsiblePlay(
            name=f"Setup {db_type} database",
            hosts="database_servers",
            tasks=tasks,
            become=False,
            gather_facts=True
        )
        
        playbook_path = self.ansible_manager.create_playbook(
            [play], 
            f"setup_{db_type}_database"
        )
        
        return playbook_path

# Example usage
def main():
    # Create Ansible manager
    ansible_manager = AnsibleManager()
    
    # Create inventory
    inventory = {
        'web_servers': {
            'hosts': [
                {'name': 'web1.example.com', 'vars': {'ansible_user': 'ubuntu'}},
                {'name': 'web2.example.com', 'vars': {'ansible_user': 'ubuntu'}}
            ],
            'vars': {
                'http_port': 80,
                'maxRequestsPerChild': 808
            }
        },
        'database_servers': {
            'hosts': ['db1.example.com', 'db2.example.com'],
            'vars': {
                'ansible_user': 'ubuntu'
            }
        }
    }
    
    ansible_manager.create_inventory(inventory)
    
    # Create deployment manager
    deployment_manager = ApplicationDeploymentManager(ansible_manager)
    
    # Create web app deployment playbook
    web_app_playbook = deployment_manager.create_web_app_deployment(
        app_name="myapp",
        app_version="v1.2.0",
        git_repo="https://github.com/example/myapp.git",
        app_port=8080,
        environment="production"
    )
    
    # Create database setup playbook
    db_playbook = deployment_manager.create_database_setup(
        db_type="postgresql",
        db_name="myapp_db",
        db_user="myapp_user",
        db_password="secure_password_123"
    )
    
    print(f"Created web app deployment playbook: {web_app_playbook}")
    print(f"Created database setup playbook: {db_playbook}")
    
    # Run playbooks (uncomment to actually execute)
    # ansible_manager.run_playbook(db_playbook, check_mode=True)
    # ansible_manager.run_playbook(web_app_playbook, check_mode=True)

if __name__ == "__main__":
    main()
```

## Best Practices

### Configuration Security and Validation

**DevOps Usage Scenario**: Implementing secure configuration management with encryption, validation, and audit trails.

```python
import os
import hashlib
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import json
import yaml
from typing import Dict, Any, List
import logging
from datetime import datetime
from pathlib import Path

class SecureConfigManager:
    """Secure configuration management with encryption and validation"""
    
    def __init__(self, password: str = None):
        self.logger = logging.getLogger(__name__)
        self.encryption_key = self._derive_key(password) if password else None
        self.audit_log = []
    
    def _derive_key(self, password: str) -> bytes:
        """Derive encryption key from password"""
        password_bytes = password.encode()
        salt = b'salt_1234567890'  # In production, use random salt
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password_bytes))
        return key
    
    def encrypt_value(self, value: str) -> str:
        """Encrypt a configuration value"""
        if not self.encryption_key:
            raise ValueError("No encryption key available")
        
        f = Fernet(self.encryption_key)
        encrypted_value = f.encrypt(value.encode())
        return base64.urlsafe_b64encode(encrypted_value).decode()
    
    def decrypt_value(self, encrypted_value: str) -> str:
        """Decrypt a configuration value"""
        if not self.encryption_key:
            raise ValueError("No encryption key available")
        
        f = Fernet(self.encryption_key)
        encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode())
        decrypted_value = f.decrypt(encrypted_bytes)
        return decrypted_value.decode()
    
    def encrypt_sensitive_values(self, config: Dict[str, Any], 
                               sensitive_keys: List[str]) -> Dict[str, Any]:
        """Encrypt sensitive values in configuration"""
        encrypted_config = config.copy()
        
        for key_path in sensitive_keys:
            keys = key_path.split('.')
            current = encrypted_config
            
            # Navigate to the parent of the target key
            for key in keys[:-1]:
                if key in current and isinstance(current[key], dict):
                    current = current[key]
                else:
                    break
            else:
                # Encrypt the final key's value
                final_key = keys[-1]
                if final_key in current and isinstance(current[final_key], str):
                    original_value = current[final_key]
                    encrypted_value = self.encrypt_value(original_value)
                    current[final_key] = f"ENC[{encrypted_value}]"
                    
                    self._log_audit(
                        "encrypt",
                        f"Encrypted sensitive value at {key_path}",
                        {"key_path": key_path}
                    )
        
        return encrypted_config
    
    def decrypt_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt all encrypted values in configuration"""
        decrypted_config = self._deep_copy_and_decrypt(config)
        return decrypted_config
    
    def _deep_copy_and_decrypt(self, obj: Any) -> Any:
        """Recursively decrypt encrypted values in nested structures"""
        if isinstance(obj, dict):
            return {k: self._deep_copy_and_decrypt(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._deep_copy_and_decrypt(item) for item in obj]
        elif isinstance(obj, str) and obj.startswith("ENC[") and obj.endswith("]"):
            encrypted_value = obj[4:-1]  # Remove "ENC[" and "]"
            return self.decrypt_value(encrypted_value)
        else:
            return obj
    
    def _log_audit(self, action: str, description: str, metadata: Dict[str, Any] = None):
        """Log configuration management actions for audit trail"""
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "action": action,
            "description": description,
            "metadata": metadata or {}
        }
        self.audit_log.append(audit_entry)
        self.logger.info(f"Audit: {action} - {description}")
    
    def get_audit_log(self) -> List[Dict[str, Any]]:
        """Get audit log entries"""
        return self.audit_log.copy()
    
    def validate_config_integrity(self, config_file: str) -> bool:
        """Validate configuration file integrity using checksums"""
        try:
            with open(config_file, 'rb') as f:
                content = f.read()
            
            checksum = hashlib.sha256(content).hexdigest()
            checksum_file = f"{config_file}.sha256"
            
            if os.path.exists(checksum_file):
                with open(checksum_file, 'r') as f:
                    stored_checksum = f.read().strip()
                
                if checksum == stored_checksum:
                    self.logger.info(f"Config integrity verified: {config_file}")
                    return True
                else:
                    self.logger.error(f"Config integrity check failed: {config_file}")
                    return False
            else:
                # Create checksum file
                with open(checksum_file, 'w') as f:
                    f.write(checksum)
                self.logger.info(f"Created checksum file: {checksum_file}")
                return True
                
        except Exception as e:
            self.logger.error(f"Error validating config integrity: {e}")
            return False

class ConfigurationValidator:
    """Advanced configuration validation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.validation_rules = {}
    
    def add_validation_rule(self, key_path: str, validator_func, error_message: str):
        """Add custom validation rule"""
        self.validation_rules[key_path] = {
            'validator': validator_func,
            'error_message': error_message
        }
    
    def validate_config(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Validate configuration using custom rules"""
        validation_results = {
            'valid': True,
            'errors': [],
            'warnings': []
        }
        
        for key_path, rule in self.validation_rules.items():
            try:
                value = self._get_nested_value(config, key_path)
                if value is not None:
                    if not rule['validator'](value):
                        validation_results['valid'] = False
                        validation_results['errors'].append({
                            'key_path': key_path,
                            'message': rule['error_message'],
                            'value': str(value)
                        })
            except KeyError:
                validation_results['warnings'].append({
                    'key_path': key_path,
                    'message': f"Configuration key {key_path} not found"
                })
        
        return validation_results
    
    def _get_nested_value(self, config: Dict[str, Any], key_path: str) -> Any:
        """Get value from nested configuration using dot notation"""
        keys = key_path.split('.')
        value = config
        
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                raise KeyError(f"Key {key_path} not found")
        
        return value
    
    def validate_environment_consistency(self, 
                                       configs: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
        """Validate consistency across different environment configurations"""
        consistency_results = {
            'consistent': True,
            'inconsistencies': []
        }
        
        if len(configs) < 2:
            return consistency_results
        
        # Get all unique key paths from all configs
        all_key_paths = set()
        for config in configs.values():
            all_key_paths.update(self._get_all_key_paths(config))
        
        # Check each key path across environments
        for key_path in all_key_paths:
            values = {}
            for env_name, config in configs.items():
                try:
                    value = self._get_nested_value(config, key_path)
                    values[env_name] = value
                except KeyError:
                    values[env_name] = None
            
            # Check for type consistency (all values should be same type)
            non_none_values = [v for v in values.values() if v is not None]
            if non_none_values:
                first_type = type(non_none_values[0])
                if not all(type(v) == first_type for v in non_none_values):
                    consistency_results['consistent'] = False
                    consistency_results['inconsistencies'].append({
                        'key_path': key_path,
                        'issue': 'type_mismatch',
                        'values': {env: str(type(v)) for env, v in values.items()}
                    })
        
        return consistency_results
    
    def _get_all_key_paths(self, config: Dict[str, Any], prefix: str = "") -> List[str]:
        """Get all key paths in a nested configuration"""
        key_paths = []
        
        for key, value in config.items():
            current_path = f"{prefix}.{key}" if prefix else key
            key_paths.append(current_path)
            
            if isinstance(value, dict):
                key_paths.extend(self._get_all_key_paths(value, current_path))
        
        return key_paths

# Configuration management best practices example
def demonstrate_best_practices():
    """Demonstrate configuration management best practices"""
    
    # Initialize secure config manager
    secure_manager = SecureConfigManager(password="my_secure_password_123")
    
    # Sample configuration with sensitive data
    config = {
        'application': {
            'name': 'myapp',
            'version': '1.0.0',
            'debug': False
        },
        'database': {
            'host': 'db.example.com',
            'port': 5432,
            'name': 'myapp_db',
            'username': 'dbuser',
            'password': 'super_secret_password',
            'ssl_enabled': True
        },
        'api_keys': {
            'stripe': 'sk_live_abc123def456',
            'sendgrid': 'SG.xyz789.abc123'
        },
        'redis': {
            'url': 'redis://redis.example.com:6379/0',
            'password': 'redis_secret_password'
        }
    }
    
    # Define sensitive keys that should be encrypted
    sensitive_keys = [
        'database.password',
        'api_keys.stripe',
        'api_keys.sendgrid',
        'redis.password'
    ]
    
    # Encrypt sensitive values
    encrypted_config = secure_manager.encrypt_sensitive_values(config, sensitive_keys)
    
    # Save encrypted configuration
    with open('config_encrypted.yaml', 'w') as f:
        yaml.dump(encrypted_config, f, default_flow_style=False)
    
    print("Encrypted configuration saved to config_encrypted.yaml")
    
    # Validate file integrity
    integrity_valid = secure_manager.validate_config_integrity('config_encrypted.yaml')
    print(f"Configuration integrity valid: {integrity_valid}")
    
    # Load and decrypt configuration
    with open('config_encrypted.yaml', 'r') as f:
        loaded_encrypted_config = yaml.safe_load(f)
    
    decrypted_config = secure_manager.decrypt_config(loaded_encrypted_config)
    print("Configuration decrypted successfully")
    
    # Set up validation rules
    validator = ConfigurationValidator()
    
    # Add validation rules
    validator.add_validation_rule(
        'database.port',
        lambda x: isinstance(x, int) and 1 <= x <= 65535,
        'Database port must be a valid integer between 1 and 65535'
    )
    
    validator.add_validation_rule(
        'database.ssl_enabled',
        lambda x: isinstance(x, bool),
        'Database SSL enabled must be a boolean value'
    )
    
    validator.add_validation_rule(
        'application.version',
        lambda x: isinstance(x, str) and len(x.split('.')) == 3,
        'Application version must be in semantic versioning format (x.y.z)'
    )
    
    # Validate configuration
    validation_results = validator.validate_config(decrypted_config)
    
    if validation_results['valid']:
        print("Configuration validation passed")
    else:
        print("Configuration validation failed:")
        for error in validation_results['errors']:
            print(f"  - {error['key_path']}: {error['message']}")
    
    # Print audit log
    print("\nAudit Log:")
    for entry in secure_manager.get_audit_log():
        print(f"  {entry['timestamp']}: {entry['action']} - {entry['description']}")

if __name__ == "__main__":
    demonstrate_best_practices()
```

This comprehensive configuration management guide covers:

1. **YAML and JSON Processing**: Advanced configuration loading, validation, and templating
2. **Infrastructure as Code**: Terraform, CloudFormation, and Pulumi integration
3. **Configuration Management Tools**: Ansible automation and playbook generation
4. **Best Practices**: Security, encryption, validation, and audit trails

The examples demonstrate real-world DevOps scenarios like:
- Managing complex application configurations across environments
- Generating infrastructure code programmatically
- Automating server configuration and application deployment
- Implementing secure configuration management with encryption
- Validating configuration consistency and integrity

Each section includes practical, production-ready code that DevOps engineers can adapt for their specific use cases.