# Python DevOps Study Guide - Part 1: Core Python Fundamentals

## Module 1: Advanced Object-Oriented Programming

### 1.1 Metaclasses and Custom Descriptors

**Concept**: Metaclasses control how classes are created, while descriptors control attribute access.

**Real-world DevOps Use Case**: Building a configuration management system with automatic validation and type conversion.

```python
# Descriptor for configuration validation
class ConfigDescriptor:
    def __init__(self, name, config_type, default=None, validator=None):
        self.name = name
        self.config_type = config_type
        self.default = default
        self.validator = validator
        self.private_name = f'_{name}'
    
    def __get__(self, obj, objtype=None):
        if obj is None:
            return self
        return getattr(obj, self.private_name, self.default)
    
    def __set__(self, obj, value):
        # Type conversion
        if not isinstance(value, self.config_type):
            try:
                value = self.config_type(value)
            except (ValueError, TypeError):
                raise ValueError(f"{self.name} must be of type {self.config_type.__name__}")
        
        # Custom validation
        if self.validator and not self.validator(value):
            raise ValueError(f"Invalid value for {self.name}: {value}")
        
        setattr(obj, self.private_name, value)

# Metaclass for automatic configuration registration
class ConfigMeta(type):
    def __new__(cls, name, bases, namespace):
        # Collect all config descriptors
        config_fields = {}
        for key, value in namespace.items():
            if isinstance(value, ConfigDescriptor):
                config_fields[key] = value
        
        # Add config registry to class
        namespace['_config_fields'] = config_fields
        
        # Add validation method
        def validate_all(self):
            """Validate all configuration values"""
            errors = []
            for field_name, descriptor in self._config_fields.items():
                try:
                    # Trigger validation by accessing the property
                    getattr(self, field_name)
                except ValueError as e:
                    errors.append(str(e))
            if errors:
                raise ValueError(f"Configuration validation failed: {', '.join(errors)}")
            return True
        
        namespace['validate_all'] = validate_all
        
        return super().__new__(cls, name, bases, namespace)

# Example usage: AWS EC2 instance configuration
class EC2Config(metaclass=ConfigMeta):
    # Configuration descriptors with validation
    instance_type = ConfigDescriptor(
        'instance_type', 
        str, 
        default='t3.micro',
        validator=lambda x: x in ['t3.micro', 't3.small', 't3.medium', 't3.large']
    )
    
    min_size = ConfigDescriptor(
        'min_size', 
        int, 
        default=1,
        validator=lambda x: 1 <= x <= 100
    )
    
    max_size = ConfigDescriptor(
        'max_size', 
        int, 
        default=10,
        validator=lambda x: 1 <= x <= 100
    )
    
    enable_monitoring = ConfigDescriptor('enable_monitoring', bool, default=True)
    
    def __init__(self, **kwargs):
        # Set configuration values
        for key, value in kwargs.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        # Validate all configurations
        self.validate_all()
    
    def to_terraform(self):
        """Generate Terraform configuration"""
        return {
            'instance_type': self.instance_type,
            'min_size': self.min_size,
            'max_size': self.max_size,
            'enable_detailed_monitoring': self.enable_monitoring
        }

# Example usage
if __name__ == "__main__":
    # Valid configuration
    config = EC2Config(
        instance_type='t3.small',
        min_size=2,
        max_size=5,
        enable_monitoring=True
    )
    
    print("Configuration:", config.to_terraform())
    
    # Invalid configuration will raise error
    try:
        invalid_config = EC2Config(instance_type='invalid-type')
    except ValueError as e:
        print(f"Validation error: {e}")
```

**Exercise 1**: Create a `KubernetesConfig` class using the same pattern for pod configuration with descriptors for `replicas`, `cpu_request`, `memory_request`, and `namespace`.

### 1.2 Abstract Base Classes (ABC)

**Concept**: Define interfaces and enforce implementation in subclasses.

**Use Case**: Creating a plugin system for different cloud providers.

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Any
import json

class CloudProvider(ABC):
    """Abstract base class for cloud providers"""
    
    def __init__(self, region: str, credentials: Dict[str, str]):
        self.region = region
        self.credentials = credentials
        self._client = None
    
    @abstractmethod
    def authenticate(self) -> bool:
        """Authenticate with the cloud provider"""
        pass
    
    @abstractmethod
    def create_instance(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create a compute instance"""
        pass
    
    @abstractmethod
    def list_instances(self) -> List[Dict[str, Any]]:
        """List all instances"""
        pass
    
    @abstractmethod
    def delete_instance(self, instance_id: str) -> bool:
        """Delete an instance"""
        pass
    
    @abstractmethod
    def get_cost(self, start_date: str, end_date: str) -> float:
        """Get cost for a date range"""
        pass
    
    # Concrete method available to all subclasses
    def health_check(self) -> Dict[str, Any]:
        """Perform health check"""
        try:
            instances = self.list_instances()
            return {
                'status': 'healthy',
                'instance_count': len(instances),
                'region': self.region,
                'timestamp': self._get_timestamp()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'region': self.region,
                'timestamp': self._get_timestamp()
            }
    
    def _get_timestamp(self) -> str:
        from datetime import datetime
        return datetime.utcnow().isoformat()

# AWS Implementation
class AWSProvider(CloudProvider):
    def authenticate(self) -> bool:
        """Authenticate with AWS"""
        try:
            import boto3
            self._client = boto3.client(
                'ec2',
                region_name=self.region,
                aws_access_key_id=self.credentials['access_key'],
                aws_secret_access_key=self.credentials['secret_key']
            )
            # Test authentication
            self._client.describe_regions()
            return True
        except Exception as e:
            print(f"AWS authentication failed: {e}")
            return False
    
    def create_instance(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create EC2 instance"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        response = self._client.run_instances(
            ImageId=config.get('image_id', 'ami-12345678'),
            MinCount=1,
            MaxCount=1,
            InstanceType=config.get('instance_type', 't3.micro'),
            KeyName=config.get('key_name'),
            SecurityGroupIds=config.get('security_groups', []),
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': config.get('tags', [])
                }
            ]
        )
        
        instance = response['Instances'][0]
        return {
            'id': instance['InstanceId'],
            'type': instance['InstanceType'],
            'state': instance['State']['Name'],
            'provider': 'aws'
        }
    
    def list_instances(self) -> List[Dict[str, Any]]:
        """List EC2 instances"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        response = self._client.describe_instances()
        instances = []
        
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                instances.append({
                    'id': instance['InstanceId'],
                    'type': instance['InstanceType'],
                    'state': instance['State']['Name'],
                    'provider': 'aws',
                    'launch_time': instance.get('LaunchTime', '').isoformat() if instance.get('LaunchTime') else None
                })
        
        return instances
    
    def delete_instance(self, instance_id: str) -> bool:
        """Terminate EC2 instance"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        try:
            self._client.terminate_instances(InstanceIds=[instance_id])
            return True
        except Exception as e:
            print(f"Failed to delete instance {instance_id}: {e}")
            return False
    
    def get_cost(self, start_date: str, end_date: str) -> float:
        """Get AWS costs (simplified)"""
        # In real implementation, use AWS Cost Explorer API
        # This is a mock implementation
        instances = self.list_instances()
        running_instances = [i for i in instances if i['state'] == 'running']
        
        # Mock calculation: $0.01 per hour per instance
        from datetime import datetime
        start = datetime.fromisoformat(start_date)
        end = datetime.fromisoformat(end_date)
        hours = (end - start).total_seconds() / 3600
        
        return len(running_instances) * hours * 0.01

# Azure Implementation
class AzureProvider(CloudProvider):
    def authenticate(self) -> bool:
        """Authenticate with Azure"""
        try:
            # Mock authentication - in real implementation use Azure SDK
            if 'tenant_id' in self.credentials and 'client_id' in self.credentials:
                self._client = "azure_client_mock"  # Mock client
                return True
            return False
        except Exception as e:
            print(f"Azure authentication failed: {e}")
            return False
    
    def create_instance(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create Azure VM"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        # Mock implementation
        import uuid
        instance_id = f"vm-{uuid.uuid4().hex[:8]}"
        
        return {
            'id': instance_id,
            'type': config.get('vm_size', 'Standard_B1s'),
            'state': 'running',
            'provider': 'azure'
        }
    
    def list_instances(self) -> List[Dict[str, Any]]:
        """List Azure VMs"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        # Mock implementation
        return [
            {
                'id': 'vm-12345678',
                'type': 'Standard_B1s',
                'state': 'running',
                'provider': 'azure',
                'launch_time': '2024-01-01T10:00:00'
            }
        ]
    
    def delete_instance(self, instance_id: str) -> bool:
        """Delete Azure VM"""
        if not self._client:
            raise RuntimeError("Not authenticated")
        
        print(f"Deleting Azure VM: {instance_id}")
        return True
    
    def get_cost(self, start_date: str, end_date: str) -> float:
        """Get Azure costs"""
        # Mock implementation
        return 45.67

# Cloud Manager using the ABC pattern
class CloudManager:
    """Manages multiple cloud providers"""
    
    def __init__(self):
        self.providers: Dict[str, CloudProvider] = {}
    
    def add_provider(self, name: str, provider: CloudProvider) -> bool:
        """Add a cloud provider"""
        if provider.authenticate():
            self.providers[name] = provider
            return True
        return False
    
    def create_instance_multicloud(self, provider_name: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create instance on specific provider"""
        if provider_name not in self.providers:
            raise ValueError(f"Provider {provider_name} not found")
        
        return self.providers[provider_name].create_instance(config)
    
    def get_all_instances(self) -> Dict[str, List[Dict[str, Any]]]:
        """Get instances from all providers"""
        all_instances = {}
        for name, provider in self.providers.items():
            try:
                all_instances[name] = provider.list_instances()
            except Exception as e:
                all_instances[name] = {'error': str(e)}
        return all_instances
    
    def health_check_all(self) -> Dict[str, Dict[str, Any]]:
        """Health check all providers"""
        health_status = {}
        for name, provider in self.providers.items():
            health_status[name] = provider.health_check()
        return health_status
    
    def get_total_cost(self, start_date: str, end_date: str) -> Dict[str, float]:
        """Get costs from all providers"""
        costs = {}
        for name, provider in self.providers.items():
            try:
                costs[name] = provider.get_cost(start_date, end_date)
            except Exception as e:
                costs[name] = f"Error: {e}"
        return costs

# Example usage
if __name__ == "__main__":
    # Initialize cloud manager
    manager = CloudManager()
    
    # Add AWS provider
    aws_creds = {
        'access_key': 'your-access-key',
        'secret_key': 'your-secret-key'
    }
    aws_provider = AWSProvider('us-east-1', aws_creds)
    manager.add_provider('aws', aws_provider)
    
    # Add Azure provider
    azure_creds = {
        'tenant_id': 'your-tenant-id',
        'client_id': 'your-client-id',
        'client_secret': 'your-client-secret'
    }
    azure_provider = AzureProvider('eastus', azure_creds)
    manager.add_provider('azure', azure_provider)
    
    # Health check all providers
    health = manager.health_check_all()
    print("Health Status:", json.dumps(health, indent=2))
    
    # Get all instances
    instances = manager.get_all_instances()
    print("All Instances:", json.dumps(instances, indent=2))
    
    # Get costs
    costs = manager.get_total_cost('2024-01-01', '2024-01-31')
    print("Costs:", json.dumps(costs, indent=2))
```

**Exercise 2**: Extend the cloud provider system by adding a `GCPProvider` class and implementing monitoring capabilities with an abstract `Monitor` class.

### 1.3 Context Managers

**Concept**: Manage resources automatically with `__enter__` and `__exit__` methods.

**Use Case**: Safe database connections, file operations, and temporary configurations.

```python
import tempfile
import os
import shutil
from contextlib import contextmanager
from typing import Any, Dict, Optional
import json
import subprocess

class TempDirectory:
    """Context manager for temporary directories"""
    
    def __init__(self, prefix: str = "devops_", cleanup: bool = True):
        self.prefix = prefix
        self.cleanup = cleanup
        self.path: Optional[str] = None
    
    def __enter__(self) -> str:
        self.path = tempfile.mkdtemp(prefix=self.prefix)
        return self.path
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cleanup and self.path and os.path.exists(self.path):
            shutil.rmtree(self.path)
            print(f"Cleaned up temporary directory: {self.path}")

class ConfigurationContext:
    """Context manager for temporary configuration changes"""
    
    def __init__(self, config_file: str, temp_config: Dict[str, Any]):
        self.config_file = config_file
        self.temp_config = temp_config
        self.original_config: Optional[Dict[str, Any]] = None
        self.backup_file: Optional[str] = None
    
    def __enter__(self):
        # Backup original configuration
        if os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                self.original_config = json.load(f)
            
            self.backup_file = f"{self.config_file}.backup"
            shutil.copy2(self.config_file, self.backup_file)
        
        # Apply temporary configuration
        with open(self.config_file, 'w') as f:
            json.dump(self.temp_config, f, indent=2)
        
        return self.config_file
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore original configuration
        if self.backup_file and os.path.exists(self.backup_file):
            shutil.move(self.backup_file, self.config_file)
            print(f"Restored original configuration: {self.config_file}")
        elif self.original_config is None:
            # File didn't exist originally, remove it
            if os.path.exists(self.config_file):
                os.remove(self.config_file)

class ServiceManager:
    """Context manager for starting/stopping services"""
    
    def __init__(self, service_name: str, start_command: str, stop_command: str):
        self.service_name = service_name
        self.start_command = start_command
        self.stop_command = stop_command
        self.process: Optional[subprocess.Popen] = None
    
    def __enter__(self):
        print(f"Starting service: {self.service_name}")
        try:
            self.process = subprocess.Popen(
                self.start_command.split(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
            # Give service time to start
            import time
            time.sleep(2)
            
            if self.process.poll() is None:
                print(f"Service {self.service_name} started successfully")
                return self
            else:
                raise RuntimeError(f"Failed to start {self.service_name}")
        except Exception as e:
            raise RuntimeError(f"Error starting {self.service_name}: {e}")
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        print(f"Stopping service: {self.service_name}")
        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()
        
        # Also try stop command if provided
        if self.stop_command:
            try:
                subprocess.run(self.stop_command.split(), check=True)
            except subprocess.CalledProcessError:
                pass  # Ignore errors in stop command

# Function-based context manager using contextlib
@contextmanager
def environment_variables(**kwargs):
    """Temporarily set environment variables"""
    old_environ = dict(os.environ)
    os.environ.update(kwargs)
    try:
        yield
    finally:
        os.environ.clear()
        os.environ.update(old_environ)

@contextmanager
def docker_container(image: str, name: str, ports: Dict[str, str] = None, 
                    volumes: Dict[str, str] = None, environment: Dict[str, str] = None):
    """Context manager for Docker containers"""
    
    # Build docker run command
    cmd = ["docker", "run", "-d", "--name", name]
    
    # Add port mappings
    if ports:
        for host_port, container_port in ports.items():
            cmd.extend(["-p", f"{host_port}:{container_port}"])
    
    # Add volume mappings
    if volumes:
        for host_path, container_path in volumes.items():
            cmd.extend(["-v", f"{host_path}:{container_path}"])
    
    # Add environment variables
    if environment:
        for key, value in environment.items():
            cmd.extend(["-e", f"{key}={value}"])
    
    cmd.append(image)
    
    try:
        # Start container
        print(f"Starting Docker container: {name}")
        result = subprocess.run(cmd, capture_output=True, text=True, check=True)
        container_id = result.stdout.strip()
        
        # Wait for container to be ready
        import time
        time.sleep(3)
        
        yield container_id
        
    except subprocess.CalledProcessError as e:
        print(f"Failed to start container {name}: {e.stderr}")
        raise
    finally:
        # Clean up container
        print(f"Stopping and removing container: {name}")
        subprocess.run(["docker", "stop", name], capture_output=True)
        subprocess.run(["docker", "rm", name], capture_output=True)

# Example: Comprehensive deployment script using context managers
def deploy_application():
    """Example deployment using multiple context managers"""
    
    # Temporary configuration for testing
    test_config = {
        "database": {
            "host": "localhost",
            "port": 5432,
            "name": "test_db"
        },
        "app": {
            "debug": True,
            "port": 3000
        }
    }
    
    with TempDirectory(prefix="deploy_") as temp_dir:
        print(f"Working in temporary directory: {temp_dir}")
        
        # Create application files
        app_dir = os.path.join(temp_dir, "app")
        os.makedirs(app_dir)
        
        # Create a simple app file
        app_file = os.path.join(app_dir, "app.py")
        with open(app_file, 'w') as f:
            f.write("""
import json
import time

def main():
    with open('config.json', 'r') as f:
        config = json.load(f)
    print(f"App running with config: {config}")
    time.sleep(10)

if __name__ == "__main__":
    main()
""")
        
        config_file = os.path.join(app_dir, "config.json")
        
        # Use configuration context manager
        with ConfigurationContext(config_file, test_config):
            print("Running with test configuration")
            
            # Set environment variables
            with environment_variables(ENV="test", DEBUG="true"):
                print(f"Environment: {os.environ.get('ENV')}")
                
                # Start a test database container
                with docker_container(
                    image="postgres:13",
                    name="test_postgres",
                    ports={"5432": "5432"},
                    environment={
                        "POSTGRES_DB": "test_db",
                        "POSTGRES_USER": "test",
                        "POSTGRES_PASSWORD": "test123"
                    }
                ) as container_id:
                    print(f"Database container started: {container_id}")
                    
                    # Run application tests
                    try:
                        result = subprocess.run(
                            ["python", app_file],
                            cwd=app_dir,
                            capture_output=True,
                            text=True,
                            timeout=5
                        )
                        print("App output:", result.stdout)
                    except subprocess.TimeoutExpired:
                        print("App ran for expected duration")

if __name__ == "__main__":
    deploy_application()
```

**Exercise 3**: Create a context manager for managing Kubernetes port-forwarding that automatically starts and stops port forwarding to a pod.

---

## Module 2: Data Structures & Algorithms for DevOps

### 2.1 Advanced Collections

**Use Case**: Managing complex inventory and state tracking.

```python
from collections import defaultdict, Counter, namedtuple, deque
from typing import Dict, List, Set, Optional, Any
import json
import time
from datetime import datetime, timedelta

# Named tuple for infrastructure components
Server = namedtuple('Server', ['id', 'name', 'region', 'instance_type', 'status', 'tags'])
NetworkInterface = namedtuple('NetworkInterface', ['id', 'instance_id', 'private_ip', 'public_ip', 'security_groups'])
Volume = namedtuple('Volume', ['id', 'instance_id', 'size', 'volume_type', 'encrypted'])

class InfrastructureInventory:
    """Advanced inventory management using Python collections"""
    
    def __init__(self):
        # defaultdict for automatic categorization
        self.servers_by_region = defaultdict(list)
        self.servers_by_type = defaultdict(list)
        self.servers_by_tag = defaultdict(set)
        
        # Regular containers
        self.servers: Dict[str, Server] = {}
        self.network_interfaces: Dict[str, NetworkInterface] = {}
        self.volumes: Dict[str, Volume] = {}
        
        # deque for event tracking (FIFO)
        self.events = deque(maxlen=1000)  # Keep last 1000 events
        
        # Counter for statistics
        self.stats = Counter()
    
    def add_server(self, server: Server):
        """Add a server to inventory"""
        self.servers[server.id] = server
        
        # Automatic categorization using defaultdict
        self.servers_by_region[server.region].append(server.id)
        self.servers_by_type[server.instance_type].append(server.id)
        
        # Index by tags
        for tag_key, tag_value in server.tags.items():
            tag = f"{tag_key}:{tag_value}"
            self.servers_by_tag[tag].add(server.id)
        
        # Update statistics
        self.stats[f"servers_total"] += 1
        self.stats[f"servers_{server.region}"] += 1
        self.stats[f"servers_{server.instance_type}"] += 1
        
        # Log event
        self.events.append({
            'timestamp': datetime.utcnow().isoformat(),
            'event': 'server_added',
            'server_id': server.id,
            'region': server.region
        })
    
    def remove_server(self, server_id: str):
        """Remove a server from inventory"""
        if server_id not in self.servers:
            return False
        
        server = self.servers[server_id]
        
        # Remove from all indexes
        self.servers_by_region[server.region].remove(server_id)
        self.servers_by_type[server.instance_type].remove(server_id)
        
        for tag_key, tag_value in server.tags.items():
            tag = f"{tag_key}:{tag_value}"
            self.servers_by_tag[tag].discard(server_id)
        
        # Update statistics
        self.stats[f"servers_total"] -= 1
        self.stats[f"servers_{server.region}"] -= 1
        self.stats[f"servers_{server.instance_type}"] -= 1
        
        # Remove server
        del self.servers[server_id]
        
        # Log event
        self.events.append({
            'timestamp': datetime.utcnow().isoformat(),
            'event': 'server_removed',
            'server_id': server_id,
            'region': server.region
        })
        
        return True
    
    def find_servers_by_tag(self, tag_key: str, tag_value: str = None) -> List[Server]:
        """Find servers by tag using efficient indexing"""
        if tag_value:
            tag = f"{tag_key}:{tag_value}"
            server_ids = self.servers_by_tag.get(tag, set())
        else:
            # Find all servers with this tag key
            server_ids = set()
            for tag, ids in self.servers_by_tag.items():
                if tag.startswith(f"{tag_key}:"):
                    server_ids.update(ids)
        
        return [self.servers[sid] for sid in server_ids if sid in self.servers]
    
    def get_regional_summary(self) -> Dict[str, Dict[str, Any]]:
        """Get summary by region using collections"""
        summary = {}
        
        for region, server_ids in self.servers_by_region.items():
            if not server_ids:
                continue
                
            servers = [self.servers[sid] for sid in server_ids]
            
            # Use Counter for instance type distribution
            instance_types = Counter(server.instance_type for server in servers)
            status_counts = Counter(server.status for server in servers)
            
            summary[region] = {
                'total_servers': len(servers),
                'instance_types': dict(instance_types),
                'status_distribution': dict(status_counts),
                'running_servers': status_counts.get('running', 0)
            }
        
        return summary
    
    def get_recent_events(self, count: int = 10) -> List[Dict[str, Any]]:
        """Get recent events using deque"""
        return list(self.events)[-count:]
    
    def get_capacity_planning_data(self) -> Dict[str, Any]:
        """Generate capacity planning data"""
        total_servers = self.stats['servers_total']
        
        # Calculate utilization by type
        type_utilization = {}
        for instance_type, server_ids in self.servers_by_type.items():
            running_count = sum(
                1 for sid in server_ids 
                if self.servers[sid].status == 'running'
            )
            type_utilization[instance_type] = {
                'total': len(server_ids),
                'running': running_count,
                'utilization': running_count / len(server_ids) if server_ids else 0
            }
        
        return {
            'total_servers': total_servers,
            'type_utilization': type_utilization,
            'regional_distribution': dict(
                (region, len(server_ids)) 
                for region, server_ids in self.servers_by_region.items()
            )
        }

# Example: Complex dependency resolution using graphs
class DependencyGraph:
    """Manage service dependencies using graph algorithms"""
    
    def __init__(self):
        self.dependencies = defaultdict(set)  # service -> set of dependencies
        self.dependents = defaultdict(set)    # service -> set of dependents
    
    def add_dependency(self, service: str, depends_on: str):
        """Add a dependency relationship"""
        self.dependencies[service].add(depends_on)
        self.dependents[depends_on].add(service)
    
    def get_deployment_order(self) -> List[str]:
        """Get deployment order using topological sort"""
        # Kahn's algorithm for topological sorting
        in_degree = defaultdict(int)
        all_services = set(self.dependencies.keys()) | set(self.dependents.keys())
        
        # Calculate in-degrees
        for service in all_services:
            in_degree[service] = len(self.dependencies[service])
        
        # Start with services that have no dependencies
        queue = deque([service for service in all_services if in_degree[service] == 0])
        result = []
        
        while queue:
            service = queue.popleft()
            result.append(service)
            
            # Remove this service's edges
            for dependent in self.dependents[service]:
                in_degree[dependent] -= 1
                if in_degree[dependent] == 0:
                    queue.append(dependent)
        
        # Check for circular dependencies
        if len(result) != len(all_services):
            remaining = all_services - set(result)
            raise ValueError(f"Circular dependency detected among: {remaining}")
        
        return result
    
    def get_shutdown_order(self) -> List[str]:
        """Get shutdown order (reverse of deployment)"""
        return list(reversed(self.get_deployment_order()))
    
    def find_affected_services(self, service: str) -> Set[str]:
        """Find all services affected by a change to given service"""
        affected = set()
        queue = deque([service])
        
        while queue:
            current = queue.popleft()
            if current in affected:
                continue
            affected.add(current)
            
            # Add all dependents
            for dependent in self.dependents[current]:
                if dependent not in affected:
                    queue.append(dependent)
        
        return affected - {service}  # Exclude the original service

# Example usage and demonstration
if __name__ == "__main__":
    # Create inventory
    inventory = InfrastructureInventory()
    
    # Add some servers
    servers = [
        Server('srv-001', 'web-1', 'us-east-1', 't3.medium', 'running', 
               {'Environment': 'prod', 'Application': 'web', 'Team': 'frontend'}),
        Server('srv-002', 'web-2', 'us-east-1', 't3.medium', 'running',
               {'Environment': 'prod', 'Application': 'web', 'Team': 'frontend'}),
        Server('srv-003', 'db-1', 'us-west-2', 'm5.large', 'running',
               {'Environment': 'prod', 'Application': 'database', 'Team': 'backend'}),
        Server('srv-004', 'api-1', 'eu-west-1', 't3.large', 'stopped',
               {'Environment': 'staging', 'Application': 'api', 'Team': 'backend'}),
    ]
    
    for server in servers:
        inventory.add_server(server)
    
    # Demonstrate collections usage
    print("=== Inventory Statistics ===")
    print(f"Total servers: {inventory.stats['servers_total']}")
    print(f"Servers by region: {dict(inventory.stats)}")
    
    print("\n=== Regional Summary ===")
    regional_summary = inventory.get_regional_summary()
    print(json.dumps(regional_summary, indent=2))
    
    print("\n=== Find Servers by Tag ===")
    prod_servers = inventory.find_servers_by_tag('Environment', 'prod')
    print(f"Production servers: {[s.name for s in prod_servers]}")
    
    web_servers = inventory.find_servers_by_tag('Application', 'web')
    print(f"Web servers: {[s.name for s in web_servers]}")
    
    print("\n=== Recent Events ===")
    recent_events = inventory.get_recent_events(3)
    for event in recent_events:
        print(f"{event['timestamp']}: {event['event']} - {event['server_id']}")
    
    # Demonstrate dependency management
    print("\n=== Dependency Management ===")
    deps = DependencyGraph()
    
    # Define service dependencies
    deps.add_dependency('web-service', 'api-service')
    deps.add_dependency('web-service', 'auth-service')
    deps.add_dependency('api-service', 'database')
    deps.add_dependency('auth-service', 'database')
    deps.add_dependency('api-service', 'cache')
    
    deployment_order = deps.get_deployment_order()
    print(f"Deployment order: {deployment_order}")
    
    shutdown_order = deps.get_shutdown_order()
    print(f"Shutdown order: {shutdown_order}")
    
    affected = deps.find_affected_services('database')
    print(f"Services affected by database changes: {affected}")
```

**Exercise 4**: Extend the inventory system to track network relationships between servers and implement a function to find the shortest path between any two servers in the network.

### 2.2 Caching Strategies

**Use Case**: Optimizing API calls and expensive operations.

```python
import time
import hashlib
import pickle
import redis
from functools import wraps, lru_cache
from typing import Any, Callable, Optional, Dict, Union
import json
import threading
from datetime import datetime, timedelta

# Simple in-memory cache with TTL
class TTLCache:
    """Time-To-Live cache implementation"""
    
    def __init__(self, default_ttl: int = 300):  # 5 minutes default
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
        self.lock = threading.RLock()
    
    def _is_expired(self, entry: Dict[str, Any]) -> bool:
        """Check if cache entry is expired"""
        return datetime.utcnow() > entry['expires']
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        with self.lock:
            if key in self.cache:
                entry = self.cache[key]
                if not self._is_expired(entry):
                    entry['hits'] += 1
                    entry['last_accessed'] = datetime.utcnow()
                    return entry['value']
                else:
                    # Clean up expired entry
                    del self.cache[key]
            return None
    
    def put(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Put value in cache"""
        ttl = ttl or self.default_ttl
        expires = datetime.utcnow() + timedelta(seconds=ttl)
        
        with self.lock:
            self.cache[key] = {
                'value': value,
                'expires': expires,
                'created': datetime.utcnow(),
                'last_accessed': datetime.utcnow(),
                'hits': 0,
                'ttl': ttl
            }
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self.lock:
            if key in self.cache:
                del self.cache[key]
                return True
            return False
    
    def clear(self) -> None:
        """Clear all cache entries"""
        with self.lock:
            self.cache.clear()
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count"""
        with self.lock:
            expired_keys = [
                key for key, entry in self.cache.items()
                if self._is_expired(entry)
            ]
            for key in expired_keys:
                del self.cache[key]
            return len(expired_keys)
    
    def stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        with self.lock:
            total_entries = len(self.cache)
            total_hits = sum(entry['hits'] for entry in self.cache.values())
            
            if total_entries == 0:
                return {
                    'total_entries': 0,
                    'total_hits': 0,
                    'memory_usage': 0
                }
            
            # Calculate memory usage (approximate)
            memory_usage = sum(
                len(pickle.dumps(entry['value'])) for entry in self.cache.values()
            )
            
            return {
                'total_entries': total_entries,
                'total_hits': total_hits,
                'memory_usage': memory_usage,
                'average_ttl': sum(e['ttl'] for e in self.cache.values()) / total_entries
            }

# Redis-based distributed cache
class DistributedCache:
    """Redis-based distributed cache"""
    
    def __init__(self, redis_host: str = 'localhost', redis_port: int = 6379, 
                 redis_db: int = 0, default_ttl: int = 300):
        self.redis_client = redis.Redis(
            host=redis_host, 
            port=redis_port, 
            db=redis_db,
            decode_responses=False  # Handle binary data
        )
        self.default_ttl = default_ttl
    
    def _serialize(self, value: Any) -> bytes:
        """Serialize value for storage"""
        return pickle.dumps(value)
    
    def _deserialize(self, data: bytes) -> Any:
        """Deserialize value from storage"""
        return pickle.loads(data)
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from distributed cache"""
        try:
            data = self.redis_client.get(key)
            if data:
                return self._deserialize(data)
            return None
        except Exception as e:
            print(f"Cache get error: {e}")
            return None
    
    def put(self, key: str, value: Any, ttl: Optional[int] = None) -> bool:
        """Put value in distributed cache"""
        try:
            ttl = ttl or self.default_ttl
            data = self._serialize(value)
            return self.redis_client.setex(key, ttl, data)
        except Exception as e:
            print(f"Cache put error: {e}")
            return False
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception as e:
            print(f"Cache delete error: {e}")
            return False
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        try:
            return bool(self.redis_client.exists(key))
        except Exception as e:
            print(f"Cache exists error: {e}")
            return False

# Decorator for caching function results
def cached(cache_instance: Union[TTLCache, DistributedCache], 
          ttl: Optional[int] = None,
          key_generator: Optional[Callable] = None):
    """Decorator for caching function results"""
    
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            if key_generator:
                cache_key = key_generator(*args, **kwargs)
            else:
                # Default key generation
                key_parts = [func.__name__]
                key_parts.extend(str(arg) for arg in args)
                key_parts.extend(f"{k}={v}" for k, v in sorted(kwargs.items()))
                key_string = "|".join(key_parts)
                cache_key = hashlib.md5(key_string.encode()).hexdigest()
            
            # Try to get from cache
            cached_result = cache_instance.get(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = func(*args, **kwargs)
            cache_instance.put(cache_key, result, ttl)
            return result
        
        # Add cache management methods to wrapper
        wrapper.cache_clear = lambda: cache_instance.clear()
        wrapper.cache_stats = lambda: cache_instance.stats() if hasattr(cache_instance, 'stats') else {}
        
        return wrapper
    return decorator

# Example: AWS API caching
class AWSResourceManager:
    """Example AWS resource manager with caching"""
    
    def __init__(self, use_distributed_cache: bool = False):
        if use_distributed_cache:
            self.cache = DistributedCache()
        else:
            self.cache = TTLCache(default_ttl=600)  # 10 minutes
    
    @cached(cache_instance=None, ttl=300)  # Will be set in __init__
    def get_ec2_instances(self, region: str = 'us-east-1') -> List[Dict[str, Any]]:
        """Get EC2 instances with caching"""
        print(f"Fetching EC2 instances from AWS API for region: {region}")
        
        # Simulate API call delay
        time.sleep(2)
        
        # Mock EC2 instances data
        instances = [
            {
                'InstanceId': f'i-{i:010x}',
                'InstanceType': 't3.micro',
                'State': {'Name': 'running'},
                'Region': region,
                'LaunchTime': datetime.utcnow().isoformat()
            }
            for i in range(5)
        ]
        
        return instances
    
    def __init__(self, use_distributed_cache: bool = False):
        if use_distributed_cache:
            self.cache = DistributedCache()
        else:
            self.cache = TTLCache(default_ttl=600)
        
        # Set cache instance for decorator
        self.get_ec2_instances = cached(
            self.cache, 
            ttl=300,
            key_generator=lambda region='us-east-1': f"ec2_instances_{region}"
        )(self.get_ec2_instances.__func__)
    
    @cached(cache_instance=None, ttl=900)  # 15 minutes
    def get_rds_instances(self, region: str = 'us-east-1') -> List[Dict[str, Any]]:
        """Get RDS instances with caching"""
        print(f"Fetching RDS instances from AWS API for region: {region}")
        
        # Simulate API call delay
        time.sleep(3)
        
        # Mock RDS instances data
        instances = [
            {
                'DBInstanceIdentifier': f'db-{i}',
                'DBInstanceClass': 'db.t3.micro',
                'DBInstanceStatus': 'available',
                'Region': region,
                'Engine': 'postgres'
            }
            for i in range(3)
        ]
        
        return instances
    
    def __init__(self, use_distributed_cache: bool = False):
        if use_distributed_cache:
            self.cache = DistributedCache()
        else:
            self.cache = TTLCache(default_ttl=600)
        
        # Set cache instance for all cached methods
        self.get_ec2_instances = cached(
            self.cache, 
            ttl=300,
            key_generator=lambda region='us-east-1': f"ec2_instances_{region}"
        )(self.get_ec2_instances.__func__)
        
        self.get_rds_instances = cached(
            self.cache,
            ttl=900,
            key_generator=lambda region='us-east-1': f"rds_instances_{region}"
        )(self.get_rds_instances.__func__)
    
    def get_cache_statistics(self) -> Dict[str, Any]:
        """Get cache statistics"""
        if hasattr(self.cache, 'stats'):
            return self.cache.stats()
        return {}

# Multi-level caching strategy
class MultiLevelCache:
    """Multi-level cache with L1 (memory) and L2 (distributed) levels"""
    
    def __init__(self, l1_ttl: int = 60, l2_ttl: int = 300):
        self.l1_cache = TTLCache(default_ttl=l1_ttl)  # Fast memory cache
        self.l2_cache = DistributedCache(default_ttl=l2_ttl)  # Slower distributed cache
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from multi-level cache"""
        # Try L1 cache first
        value = self.l1_cache.get(key)
        if value is not None:
            return value
        
        # Try L2 cache
        value = self.l2_cache.get(key)
        if value is not None:
            # Populate L1 cache
            self.l1_cache.put(key, value)
            return value
        
        return None
    
    def put(self, key: str, value: Any) -> None:
        """Put value in both cache levels"""
        self.l1_cache.put(key, value)
        self.l2_cache.put(key, value)
    
    def delete(self, key: str) -> None:
        """Delete from both cache levels"""
        self.l1_cache.delete(key)
        self.l2_cache.delete(key)

# Example usage and performance testing
if __name__ == "__main__":
    print("=== Caching Performance Test ===")
    
    # Test TTL Cache
    cache = TTLCache(default_ttl=5)  # 5 seconds TTL for demo
    
    # Test basic operations
    cache.put("test_key", "test_value", ttl=10)
    print(f"Cached value: {cache.get('test_key')}")
    
    # Test expiration
    cache.put("expire_key", "expire_value", ttl=1)
    time.sleep(2)
    print(f"Expired value: {cache.get('expire_key')}")  # Should be None
    
    # Test AWS Resource Manager
    print("\n=== AWS Resource Manager Test ===")
    aws_manager = AWSResourceManager(use_distributed_cache=False)
    
    # First call - will hit API
    start_time = time.time()
    instances1 = aws_manager.get_ec2_instances('us-east-1')
    first_call_time = time.time() - start_time
    
    # Second call - will hit cache
    start_time = time.time()
    instances2 = aws_manager.get_ec2_instances('us-east-1')
    second_call_time = time.time() - start_time
    
    print(f"First call time: {first_call_time:.2f}s")
    print(f"Second call time: {second_call_time:.2f}s")
    print(f"Speedup: {first_call_time/second_call_time:.2f}x")
    print(f"Results match: {instances1 == instances2}")
    
    # Cache statistics
    print(f"Cache stats: {aws_manager.get_cache_statistics()}")
```

**Exercise 5**: Implement a cache warming system that pre-loads frequently accessed data and a cache invalidation system that can selectively remove related cache entries when data changes.

---

This concludes Part 1 of the study guide. Would you like me to continue with Part 2 covering Advanced Python Concepts, or would you prefer to focus on specific sections from Part 1 first?