# Advanced Python Language Features for DevOps Engineers

## Table of Contents
1. [Object-Oriented Programming (OOP)](#object-oriented-programming-oop)
2. [Functional Programming](#functional-programming)
3. [Concurrency and Parallelism](#concurrency-and-parallelism)
4. [Error Handling and Debugging](#error-handling-and-debugging)

## Object-Oriented Programming (OOP)

### Classes, Inheritance, Polymorphism, Encapsulation

**DevOps Usage Scenario**: Creating reusable infrastructure components and cloud resource managers.

```python
from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import boto3
import logging

class CloudResource(ABC):
    """Abstract base class for cloud resources"""
    
    def __init__(self, name: str, region: str, tags: Dict[str, str] = None):
        self._name = name
        self._region = region
        self._tags = tags or {}
        self._logger = logging.getLogger(self.__class__.__name__)
    
    @property
    def name(self) -> str:
        return self._name
    
    @property
    def region(self) -> str:
        return self._region
    
    @abstractmethod
    def create(self) -> bool:
        """Create the cloud resource"""
        pass
    
    @abstractmethod
    def delete(self) -> bool:
        """Delete the cloud resource"""
        pass
    
    @abstractmethod
    def get_status(self) -> str:
        """Get current status of the resource"""
        pass
    
    def add_tags(self, tags: Dict[str, str]) -> None:
        """Add tags to the resource"""
        self._tags.update(tags)

class EC2Instance(CloudResource):
    """EC2 Instance implementation"""
    
    def __init__(self, name: str, region: str, instance_type: str = 't2.micro', 
                 ami_id: str = 'ami-0abcdef1234567890', tags: Dict[str, str] = None):
        super().__init__(name, region, tags)
        self.instance_type = instance_type
        self.ami_id = ami_id
        self.instance_id: Optional[str] = None
        self._ec2_client = boto3.client('ec2', region_name=region)
    
    def create(self) -> bool:
        """Create EC2 instance"""
        try:
            response = self._ec2_client.run_instances(
                ImageId=self.ami_id,
                MinCount=1,
                MaxCount=1,
                InstanceType=self.instance_type,
                TagSpecifications=[
                    {
                        'ResourceType': 'instance',
                        'Tags': [{'Key': k, 'Value': v} for k, v in self._tags.items()]
                    }
                ]
            )
            self.instance_id = response['Instances'][0]['InstanceId']
            self._logger.info(f"Created EC2 instance: {self.instance_id}")
            return True
        except Exception as e:
            self._logger.error(f"Failed to create EC2 instance: {e}")
            return False
    
    def delete(self) -> bool:
        """Terminate EC2 instance"""
        if not self.instance_id:
            self._logger.warning("No instance ID available for deletion")
            return False
        
        try:
            self._ec2_client.terminate_instances(InstanceIds=[self.instance_id])
            self._logger.info(f"Terminated EC2 instance: {self.instance_id}")
            return True
        except Exception as e:
            self._logger.error(f"Failed to terminate EC2 instance: {e}")
            return False
    
    def get_status(self) -> str:
        """Get instance status"""
        if not self.instance_id:
            return "not_created"
        
        try:
            response = self._ec2_client.describe_instances(InstanceIds=[self.instance_id])
            return response['Reservations'][0]['Instances'][0]['State']['Name']
        except Exception as e:
            self._logger.error(f"Failed to get instance status: {e}")
            return "unknown"

class RDSInstance(CloudResource):
    """RDS Instance implementation"""
    
    def __init__(self, name: str, region: str, db_instance_class: str = 'db.t3.micro',
                 engine: str = 'mysql', tags: Dict[str, str] = None):
        super().__init__(name, region, tags)
        self.db_instance_class = db_instance_class
        self.engine = engine
        self._rds_client = boto3.client('rds', region_name=region)
    
    def create(self) -> bool:
        """Create RDS instance"""
        try:
            self._rds_client.create_db_instance(
                DBInstanceIdentifier=self._name,
                DBInstanceClass=self.db_instance_class,
                Engine=self.engine,
                MasterUsername='admin',
                MasterUserPassword='temp_password_123',
                AllocatedStorage=20,
                Tags=[{'Key': k, 'Value': v} for k, v in self._tags.items()]
            )
            self._logger.info(f"Created RDS instance: {self._name}")
            return True
        except Exception as e:
            self._logger.error(f"Failed to create RDS instance: {e}")
            return False
    
    def delete(self) -> bool:
        """Delete RDS instance"""
        try:
            self._rds_client.delete_db_instance(
                DBInstanceIdentifier=self._name,
                SkipFinalSnapshot=True
            )
            self._logger.info(f"Deleted RDS instance: {self._name}")
            return True
        except Exception as e:
            self._logger.error(f"Failed to delete RDS instance: {e}")
            return False
    
    def get_status(self) -> str:
        """Get RDS instance status"""
        try:
            response = self._rds_client.describe_db_instances(
                DBInstanceIdentifier=self._name
            )
            return response['DBInstances'][0]['DBInstanceStatus']
        except Exception as e:
            self._logger.error(f"Failed to get RDS status: {e}")
            return "unknown"

# Infrastructure Manager using polymorphism
class InfrastructureManager:
    """Manages multiple cloud resources"""
    
    def __init__(self):
        self.resources: List[CloudResource] = []
    
    def add_resource(self, resource: CloudResource) -> None:
        """Add a resource to management"""
        self.resources.append(resource)
    
    def deploy_all(self) -> Dict[str, bool]:
        """Deploy all resources"""
        results = {}
        for resource in self.resources:
            results[resource.name] = resource.create()
        return results
    
    def destroy_all(self) -> Dict[str, bool]:
        """Destroy all resources"""
        results = {}
        for resource in self.resources:
            results[resource.name] = resource.delete()
        return results
    
    def get_status_all(self) -> Dict[str, str]:
        """Get status of all resources"""
        status = {}
        for resource in self.resources:
            status[resource.name] = resource.get_status()
        return status

# Usage example
def main():
    # Create infrastructure manager
    infra_manager = InfrastructureManager()
    
    # Add resources
    web_server = EC2Instance(
        name="web-server-01",
        region="us-east-1",
        instance_type="t3.small",
        tags={"Environment": "production", "Team": "web"}
    )
    
    database = RDSInstance(
        name="app-database",
        region="us-east-1",
        db_instance_class="db.t3.small",
        engine="postgresql",
        tags={"Environment": "production", "Team": "database"}
    )
    
    infra_manager.add_resource(web_server)
    infra_manager.add_resource(database)
    
    # Deploy infrastructure
    deployment_results = infra_manager.deploy_all()
    print("Deployment results:", deployment_results)
    
    # Check status
    status = infra_manager.get_status_all()
    print("Resource status:", status)

if __name__ == "__main__":
    main()
```

### Design Patterns for DevOps

**Singleton Pattern for Configuration Management**:

```python
import threading
import yaml
from typing import Dict, Any

class ConfigurationManager:
    """Singleton configuration manager for DevOps applications"""
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self._config: Dict[str, Any] = {}
            self._config_file: str = "config.yaml"
            self._load_config()
            self._initialized = True
    
    def _load_config(self) -> None:
        """Load configuration from file"""
        try:
            with open(self._config_file, 'r') as file:
                self._config = yaml.safe_load(file) or {}
        except FileNotFoundError:
            self._config = {}
    
    def get(self, key: str, default: Any = None) -> Any:
        """Get configuration value"""
        keys = key.split('.')
        value = self._config
        for k in keys:
            if isinstance(value, dict) and k in value:
                value = value[k]
            else:
                return default
        return value
    
    def set(self, key: str, value: Any) -> None:
        """Set configuration value"""
        keys = key.split('.')
        config = self._config
        for k in keys[:-1]:
            if k not in config:
                config[k] = {}
            config = config[k]
        config[keys[-1]] = value
    
    def reload(self) -> None:
        """Reload configuration from file"""
        self._load_config()

# Factory Pattern for Cloud Providers
class CloudProviderFactory:
    """Factory for creating cloud provider clients"""
    
    @staticmethod
    def create_provider(provider: str, region: str = None):
        """Create cloud provider client"""
        if provider.lower() == 'aws':
            return AWSProvider(region)
        elif provider.lower() == 'azure':
            return AzureProvider(region)
        elif provider.lower() == 'gcp':
            return GCPProvider(region)
        else:
            raise ValueError(f"Unsupported cloud provider: {provider}")

class CloudProvider(ABC):
    """Abstract cloud provider"""
    
    @abstractmethod
    def create_vm(self, **kwargs) -> str:
        pass
    
    @abstractmethod
    def delete_vm(self, vm_id: str) -> bool:
        pass

class AWSProvider(CloudProvider):
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
        self.ec2 = boto3.client('ec2', region_name=region)
    
    def create_vm(self, **kwargs) -> str:
        # AWS-specific VM creation logic
        pass
    
    def delete_vm(self, vm_id: str) -> bool:
        # AWS-specific VM deletion logic
        pass

# Observer Pattern for Monitoring
class MonitoringSubject:
    """Subject for monitoring events"""
    
    def __init__(self):
        self._observers = []
        self._state = {}
    
    def attach(self, observer):
        self._observers.append(observer)
    
    def detach(self, observer):
        self._observers.remove(observer)
    
    def notify(self, event_type: str, data: Dict[str, Any]):
        for observer in self._observers:
            observer.update(event_type, data)
    
    def set_state(self, key: str, value: Any):
        self._state[key] = value
        self.notify('state_change', {'key': key, 'value': value})

class AlertObserver:
    """Observer for sending alerts"""
    
    def update(self, event_type: str, data: Dict[str, Any]):
        if event_type == 'state_change':
            if data['key'] == 'cpu_usage' and data['value'] > 80:
                self.send_alert(f"High CPU usage: {data['value']}%")
    
    def send_alert(self, message: str):
        print(f"ALERT: {message}")

class LoggingObserver:
    """Observer for logging events"""
    
    def update(self, event_type: str, data: Dict[str, Any]):
        print(f"LOG: {event_type} - {data}")
```

## Functional Programming

### Decorators and Context Managers

**DevOps Usage Scenario**: Adding monitoring, logging, and error handling to infrastructure operations.

```python
import functools
import time
import logging
from contextlib import contextmanager
from typing import Callable, Any, Generator
import boto3
from botocore.exceptions import ClientError

# Timing decorator for performance monitoring
def monitor_execution_time(func: Callable) -> Callable:
    """Decorator to monitor function execution time"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start_time = time.time()
        try:
            result = func(*args, **kwargs)
            execution_time = time.time() - start_time
            logging.info(f"{func.__name__} executed in {execution_time:.2f} seconds")
            return result
        except Exception as e:
            execution_time = time.time() - start_time
            logging.error(f"{func.__name__} failed after {execution_time:.2f} seconds: {e}")
            raise
    return wrapper

# Retry decorator for handling transient failures
def retry(max_attempts: int = 3, delay: float = 1.0, backoff: float = 2.0):
    """Decorator for retrying functions with exponential backoff"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            attempts = 0
            current_delay = delay
            
            while attempts < max_attempts:
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    attempts += 1
                    if attempts == max_attempts:
                        logging.error(f"{func.__name__} failed after {max_attempts} attempts")
                        raise e
                    
                    logging.warning(f"{func.__name__} attempt {attempts} failed: {e}. Retrying in {current_delay}s...")
                    time.sleep(current_delay)
                    current_delay *= backoff
            
        return wrapper
    return decorator

# Authentication decorator
def require_aws_credentials(func: Callable) -> Callable:
    """Decorator to ensure AWS credentials are available"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # Test AWS credentials
            sts = boto3.client('sts')
            sts.get_caller_identity()
            return func(*args, **kwargs)
        except Exception as e:
            logging.error(f"AWS credentials not available: {e}")
            raise ValueError("Valid AWS credentials required")
    return wrapper

# Context manager for AWS resource management
@contextmanager
def aws_session(region: str = 'us-east-1') -> Generator[boto3.Session, None, None]:
    """Context manager for AWS session"""
    session = boto3.Session(region_name=region)
    try:
        logging.info(f"Created AWS session for region: {region}")
        yield session
    finally:
        logging.info("AWS session closed")

@contextmanager
def temporary_security_group(ec2_client, group_name: str, vpc_id: str) -> Generator[str, None, None]:
    """Context manager for temporary security group"""
    group_id = None
    try:
        # Create security group
        response = ec2_client.create_security_group(
            GroupName=group_name,
            Description="Temporary security group",
            VpcId=vpc_id
        )
        group_id = response['GroupId']
        logging.info(f"Created temporary security group: {group_id}")
        yield group_id
    finally:
        # Clean up security group
        if group_id:
            try:
                ec2_client.delete_security_group(GroupId=group_id)
                logging.info(f"Deleted temporary security group: {group_id}")
            except Exception as e:
                logging.error(f"Failed to delete security group {group_id}: {e}")

# Practical usage example
class InfrastructureDeployer:
    def __init__(self, region: str = 'us-east-1'):
        self.region = region
    
    @monitor_execution_time
    @retry(max_attempts=3, delay=2.0)
    @require_aws_credentials
    def deploy_instance(self, instance_config: dict) -> str:
        """Deploy EC2 instance with monitoring and retry logic"""
        with aws_session(self.region) as session:
            ec2 = session.client('ec2')
            
            response = ec2.run_instances(
                ImageId=instance_config['ami_id'],
                MinCount=1,
                MaxCount=1,
                InstanceType=instance_config['instance_type'],
                KeyName=instance_config.get('key_name'),
                SecurityGroupIds=instance_config.get('security_groups', [])
            )
            
            instance_id = response['Instances'][0]['InstanceId']
            logging.info(f"Successfully deployed instance: {instance_id}")
            return instance_id
    
    @monitor_execution_time
    def setup_networking(self, vpc_id: str) -> dict:
        """Setup networking with temporary resources"""
        with aws_session(self.region) as session:
            ec2 = session.client('ec2')
            
            with temporary_security_group(ec2, "temp-sg", vpc_id) as sg_id:
                # Add rules to security group
                ec2.authorize_security_group_ingress(
                    GroupId=sg_id,
                    IpPermissions=[
                        {
                            'IpProtocol': 'tcp',
                            'FromPort': 80,
                            'ToPort': 80,
                            'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                        }
                    ]
                )
                
                return {'security_group_id': sg_id, 'vpc_id': vpc_id}

# Higher-order functions for pipeline processing
def create_pipeline(*functions):
    """Create a processing pipeline from functions"""
    def pipeline(data):
        result = data
        for func in functions:
            result = func(result)
        return result
    return pipeline

def validate_config(config: dict) -> dict:
    """Validate configuration"""
    required_fields = ['ami_id', 'instance_type']
    for field in required_fields:
        if field not in config:
            raise ValueError(f"Missing required field: {field}")
    return config

def add_default_tags(config: dict) -> dict:
    """Add default tags to configuration"""
    default_tags = {
        'Environment': 'development',
        'Team': 'devops',
        'CreatedBy': 'automation'
    }
    config.setdefault('tags', {}).update(default_tags)
    return config

def normalize_instance_type(config: dict) -> dict:
    """Normalize instance type"""
    instance_type_map = {
        'small': 't3.small',
        'medium': 't3.medium',
        'large': 't3.large'
    }
    if config['instance_type'] in instance_type_map:
        config['instance_type'] = instance_type_map[config['instance_type']]
    return config

# Create deployment pipeline
deployment_pipeline = create_pipeline(
    validate_config,
    add_default_tags,
    normalize_instance_type
)

# Usage example
def main():
    deployer = InfrastructureDeployer('us-west-2')
    
    # Raw configuration
    config = {
        'ami_id': 'ami-0abcdef1234567890',
        'instance_type': 'small',
        'key_name': 'my-key-pair'
    }
    
    # Process through pipeline
    processed_config = deployment_pipeline(config)
    print("Processed config:", processed_config)
    
    # Deploy instance
    try:
        instance_id = deployer.deploy_instance(processed_config)
        print(f"Deployed instance: {instance_id}")
    except Exception as e:
        print(f"Deployment failed: {e}")

if __name__ == "__main__":
    main()
```

## Concurrency and Parallelism

### Asyncio for DevOps Operations

**DevOps Usage Scenario**: Managing multiple cloud resources concurrently for faster deployment and monitoring.

```python
import asyncio
import aiohttp
import time
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed
import boto3
from dataclasses import dataclass

@dataclass
class DeploymentTask:
    name: str
    region: str
    instance_type: str
    ami_id: str

class AsyncCloudManager:
    def __init__(self, max_concurrent: int = 10):
        self.max_concurrent = max_concurrent
        self.semaphore = asyncio.Semaphore(max_concurrent)
    
    async def deploy_instance_async(self, task: DeploymentTask) -> Dict[str, Any]:
        """Deploy EC2 instance asynchronously"""
        async with self.semaphore:
            try:
                # Simulate async AWS API call (in reality, you'd use aioboto3)
                await asyncio.sleep(2)  # Simulate deployment time
                
                # Create instance (simplified)
                instance_id = f"i-{task.name}-{int(time.time())}"
                
                return {
                    'name': task.name,
                    'instance_id': instance_id,
                    'status': 'success',
                    'region': task.region
                }
            except Exception as e:
                return {
                    'name': task.name,
                    'status': 'failed',
                    'error': str(e)
                }
    
    async def deploy_multiple_instances(self, tasks: List[DeploymentTask]) -> List[Dict[str, Any]]:
        """Deploy multiple instances concurrently"""
        deployment_tasks = [
            self.deploy_instance_async(task) for task in tasks
        ]
        
        results = await asyncio.gather(*deployment_tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]
    
    async def health_check(self, url: str) -> Dict[str, Any]:
        """Perform health check on a service"""
        async with aiohttp.ClientSession() as session:
            try:
                async with session.get(url, timeout=10) as response:
                    return {
                        'url': url,
                        'status_code': response.status,
                        'response_time': time.time(),
                        'healthy': response.status == 200
                    }
            except Exception as e:
                return {
                    'url': url,
                    'error': str(e),
                    'healthy': False
                }
    
    async def monitor_services(self, urls: List[str]) -> List[Dict[str, Any]]:
        """Monitor multiple services concurrently"""
        health_tasks = [self.health_check(url) for url in urls]
        results = await asyncio.gather(*health_tasks, return_exceptions=True)
        return [r for r in results if not isinstance(r, Exception)]

# Thread-based parallel processing for CPU-intensive tasks
class ParallelProcessor:
    def __init__(self, max_workers: int = 4):
        self.max_workers = max_workers
    
    def process_logs_parallel(self, log_files: List[str]) -> Dict[str, Any]:
        """Process multiple log files in parallel"""
        def process_single_log(log_file: str) -> Dict[str, Any]:
            # Simulate log processing
            time.sleep(1)  # CPU-intensive work
            return {
                'file': log_file,
                'lines_processed': 1000,
                'errors_found': 5,
                'warnings_found': 20
            }
        
        results = {}
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all tasks
            future_to_file = {
                executor.submit(process_single_log, log_file): log_file 
                for log_file in log_files
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_file):
                log_file = future_to_file[future]
                try:
                    result = future.result()
                    results[log_file] = result
                except Exception as e:
                    results[log_file] = {'error': str(e)}
        
        return results
    
    def backup_databases_parallel(self, databases: List[str]) -> Dict[str, bool]:
        """Backup multiple databases in parallel"""
        def backup_database(db_name: str) -> bool:
            # Simulate database backup
            print(f"Starting backup for {db_name}")
            time.sleep(3)  # Simulate backup time
            print(f"Completed backup for {db_name}")
            return True
        
        results = {}
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_db = {
                executor.submit(backup_database, db): db 
                for db in databases
            }
            
            for future in as_completed(future_to_db):
                db_name = future_to_db[future]
                try:
                    success = future.result()
                    results[db_name] = success
                except Exception as e:
                    results[db_name] = False
                    print(f"Backup failed for {db_name}: {e}")
        
        return results

# Advanced async patterns for DevOps
class AsyncDevOpsOrchestrator:
    def __init__(self):
        self.cloud_manager = AsyncCloudManager()
        self.processor = ParallelProcessor()
    
    async def rolling_deployment(self, instances: List[str], new_ami: str) -> Dict[str, Any]:
        """Perform rolling deployment with health checks"""
        results = {'updated': [], 'failed': [], 'total_time': 0}
        start_time = time.time()
        
        for instance in instances:
            try:
                # Update instance
                print(f"Updating instance {instance} with AMI {new_ami}")
                await asyncio.sleep(5)  # Simulate instance update
                
                # Health check after update
                health_result = await self.cloud_manager.health_check(
                    f"http://{instance}.example.com/health"
                )
                
                if health_result.get('healthy', False):
                    results['updated'].append(instance)
                    print(f"Successfully updated {instance}")
                else:
                    results['failed'].append(instance)
                    print(f"Health check failed for {instance}")
                    break  # Stop rolling deployment on failure
                
            except Exception as e:
                results['failed'].append(instance)
                print(f"Failed to update {instance}: {e}")
                break
        
        results['total_time'] = time.time() - start_time
        return results
    
    async def disaster_recovery_drill(self, backup_regions: List[str]) -> Dict[str, Any]:
        """Simulate disaster recovery across multiple regions"""
        recovery_tasks = []
        
        for region in backup_regions:
            task = asyncio.create_task(self._restore_region(region))
            recovery_tasks.append(task)
        
        results = await asyncio.gather(*recovery_tasks, return_exceptions=True)
        
        recovery_summary = {
            'successful_regions': [],
            'failed_regions': [],
            'total_recovery_time': 0
        }
        
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                recovery_summary['failed_regions'].append(backup_regions[i])
            else:
                recovery_summary['successful_regions'].append(backup_regions[i])
        
        return recovery_summary
    
    async def _restore_region(self, region: str) -> Dict[str, Any]:
        """Restore services in a specific region"""
        print(f"Starting recovery in region {region}")
        
        # Simulate recovery steps
        await asyncio.sleep(10)  # Database restore
        await asyncio.sleep(5)   # Application deployment
        await asyncio.sleep(3)   # Configuration sync
        
        print(f"Recovery completed in region {region}")
        return {'region': region, 'status': 'recovered'}

# Usage examples
async def main():
    orchestrator = AsyncDevOpsOrchestrator()
    
    # Example 1: Parallel instance deployment
    deployment_tasks = [
        DeploymentTask("web-01", "us-east-1", "t3.small", "ami-12345"),
        DeploymentTask("web-02", "us-east-1", "t3.small", "ami-12345"),
        DeploymentTask("api-01", "us-west-2", "t3.medium", "ami-67890"),
        DeploymentTask("api-02", "us-west-2", "t3.medium", "ami-67890"),
    ]
    
    print("Starting parallel deployment...")
    deployment_results = await orchestrator.cloud_manager.deploy_multiple_instances(deployment_tasks)
    print("Deployment results:", deployment_results)
    
    # Example 2: Service health monitoring
    service_urls = [
        "http://web-01.example.com/health",
        "http://web-02.example.com/health",
        "http://api-01.example.com/health",
        "http://api-02.example.com/health",
    ]
    
    print("\nStarting health checks...")
    health_results = await orchestrator.cloud_manager.monitor_services(service_urls)
    print("Health check results:", health_results)
    
    # Example 3: Rolling deployment
    instances = ["web-01", "web-02", "api-01", "api-02"]
    print("\nStarting rolling deployment...")
    rolling_results = await orchestrator.rolling_deployment(instances, "ami-new-version")
    print("Rolling deployment results:", rolling_results)

def sync_processing_example():
    """Example of synchronous parallel processing"""
    processor = ParallelProcessor()
    
    # Process log files in parallel
    log_files = [f"app-{i}.log" for i in range(1, 6)]
    print("Processing log files in parallel...")
    log_results = processor.process_logs_parallel(log_files)
    print("Log processing results:", log_results)
    
    # Backup databases in parallel
    databases = ["user_db", "inventory_db", "analytics_db", "logs_db"]
    print("\nBacking up databases in parallel...")
    backup_results = processor.backup_databases_parallel(databases)
    print("Backup results:", backup_results)

if __name__ == "__main__":
    # Run async examples
    asyncio.run(main())
    
    # Run sync parallel processing examples
    sync_processing_example()
```

## Error Handling and Debugging

### Advanced Error Handling for DevOps

**DevOps Usage Scenario**: Robust error handling for infrastructure operations with proper logging and recovery mechanisms.

```python
import logging
import traceback
import functools
import sys
from typing import Optional, Dict, Any, Callable
from enum import Enum
import json
from datetime import datetime

# Custom exception hierarchy for DevOps operations
class DevOpsException(Exception):
    """Base exception for DevOps operations"""
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        super().__init__(message)
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        self.timestamp = datetime.utcnow()

class InfrastructureException(DevOpsException):
    """Infrastructure-related exceptions"""
    pass

class DeploymentException(DevOpsException):
    """Deployment-related exceptions"""
    pass

class ConfigurationException(DevOpsException):
    """Configuration-related exceptions"""
    pass

class MonitoringException(DevOpsException):
    """Monitoring-related exceptions"""
    pass

# Error severity levels
class ErrorSeverity(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

# Advanced logging configuration
class DevOpsLogger:
    def __init__(self, name: str, log_file: str = "devops.log"):
        self.logger = logging.getLogger(name)
        self.logger.setLevel(logging.DEBUG)
        
        # Create formatters
        detailed_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(funcName)s:%(lineno)d - %(message)s'
        )
        
        json_formatter = JsonFormatter()
        
        # File handler with rotation
        from logging.handlers import RotatingFileHandler
        file_handler = RotatingFileHandler(
            log_file, maxBytes=10*1024*1024, backupCount=5
        )
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(json_formatter)
        
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(logging.INFO)
        console_handler.setFormatter(detailed_formatter)
        
        # Add handlers
        self.logger.addHandler(file_handler)
        self.logger.addHandler(console_handler)
    
    def log_exception(self, exc: Exception, severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                     context: Dict[str, Any] = None):
        """Log exception with context"""
        context = context or {}
        
        log_data = {
            'exception_type': type(exc).__name__,
            'exception_message': str(exc),
            'severity': severity.value,
            'context': context,
            'traceback': traceback.format_exc()
        }
        
        if hasattr(exc, 'error_code'):
            log_data['error_code'] = exc.error_code
        if hasattr(exc, 'details'):
            log_data['details'] = exc.details
        
        if severity in [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL]:
            self.logger.error(json.dumps(log_data))
        else:
            self.logger.warning(json.dumps(log_data))

class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)

# Error handling decorators
def handle_devops_errors(severity: ErrorSeverity = ErrorSeverity.MEDIUM,
                        reraise: bool = True):
    """Decorator for handling DevOps errors"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            logger = DevOpsLogger(func.__module__)
            try:
                return func(*args, **kwargs)
            except DevOpsException as e:
                logger.log_exception(e, severity, {
                    'function': func.__name__,
                    'args': str(args),
                    'kwargs': str(kwargs)
                })
                if reraise:
                    raise
                return None
            except Exception as e:
                # Convert generic exceptions to DevOpsException
                devops_exc = DevOpsException(
                    f"Unexpected error in {func.__name__}: {str(e)}",
                    error_code="UNEXPECTED_ERROR",
                    details={'original_exception': type(e).__name__}
                )
                logger.log_exception(devops_exc, ErrorSeverity.HIGH, {
                    'function': func.__name__,
                    'args': str(args),
                    'kwargs': str(kwargs)
                })
                if reraise:
                    raise devops_exc
                return None
        return wrapper
    return decorator

# Circuit breaker pattern for external services
class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.failure_count = 0
        self.last_failure_time = None
        self.state = 'CLOSED'  # CLOSED, OPEN, HALF_OPEN
    
    def call(self, func: Callable, *args, **kwargs):
        """Call function with circuit breaker protection"""
        if self.state == 'OPEN':
            if self._should_attempt_reset():
                self.state = 'HALF_OPEN'
            else:
                raise DeploymentException(
                    "Circuit breaker is OPEN - service unavailable",
                    error_code="CIRCUIT_BREAKER_OPEN"
                )
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        except Exception as e:
            self._on_failure()
            raise e
    
    def _should_attempt_reset(self) -> bool:
        """Check if we should attempt to reset the circuit breaker"""
        if self.last_failure_time is None:
            return False
        return (datetime.utcnow() - self.last_failure_time).seconds >= self.recovery_timeout
    
    def _on_success(self):
        """Handle successful call"""
        self.failure_count = 0
        self.state = 'CLOSED'
    
    def _on_failure(self):
        """Handle failed call"""
        self.failure_count += 1
        self.last_failure_time = datetime.utcnow()
        
        if self.failure_count >= self.failure_threshold:
            self.state = 'OPEN'

# Practical DevOps error handling examples
class InfrastructureManager:
    def __init__(self):
        self.logger = DevOpsLogger(__name__)
        self.circuit_breaker = CircuitBreaker()
    
    @handle_devops_errors(severity=ErrorSeverity.HIGH)
    def deploy_infrastructure(self, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy infrastructure with comprehensive error handling"""
        try:
            # Validate configuration
            self._validate_config(config)
            
            # Deploy resources
            results = {}
            for resource_type, resource_config in config.items():
                try:
                    result = self._deploy_resource(resource_type, resource_config)
                    results[resource_type] = result
                except Exception as e:
                    # Log error and continue with other resources
                    self.logger.log_exception(e, ErrorSeverity.MEDIUM, {
                        'resource_type': resource_type,
                        'resource_config': resource_config
                    })
                    results[resource_type] = {'status': 'failed', 'error': str(e)}
            
            return results
            
        except ConfigurationException as e:
            # Configuration errors are critical
            raise e
        except Exception as e:
            raise InfrastructureException(
                f"Infrastructure deployment failed: {str(e)}",
                error_code="DEPLOYMENT_FAILED"
            )
    
    def _validate_config(self, config: Dict[str, Any]):
        """Validate infrastructure configuration"""
        required_fields = ['region', 'environment']
        missing_fields = [field for field in required_fields if field not in config]
        
        if missing_fields:
            raise ConfigurationException(
                f"Missing required configuration fields: {missing_fields}",
                error_code="INVALID_CONFIG",
                details={'missing_fields': missing_fields}
            )
    
    def _deploy_resource(self, resource_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Deploy a single resource with error handling"""
        try:
            # Use circuit breaker for external API calls
            return self.circuit_breaker.call(self._call_cloud_api, resource_type, config)
        except Exception as e:
            raise InfrastructureException(
                f"Failed to deploy {resource_type}: {str(e)}",
                error_code="RESOURCE_DEPLOYMENT_FAILED",
                details={'resource_type': resource_type, 'config': config}
            )
    
    def _call_cloud_api(self, resource_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Simulate cloud API call that might fail"""
        import random
        if random.random() < 0.2:  # 20% chance of failure
            raise Exception("Simulated API failure")
        
        return {
            'status': 'success',
            'resource_id': f"{resource_type}-{random.randint(1000, 9999)}",
            'config': config
        }

# Debugging utilities for DevOps
class DevOpsDebugger:
    @staticmethod
    def create_debug_context(func_name: str, **kwargs) -> Dict[str, Any]:
        """Create debugging context for troubleshooting"""
        return {
            'function': func_name,
            'timestamp': datetime.utcnow().isoformat(),
            'parameters': kwargs,
            'system_info': {
                'python_version': sys.version,
                'platform': sys.platform
            }
        }
    
    @staticmethod
    def debug_on_exception(func: Callable) -> Callable:
        """Decorator to enter debugger on exception"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception:
                import pdb
                pdb.post_mortem()
                raise
        return wrapper

# Usage examples
def main():
    manager = InfrastructureManager()
    
    # Example 1: Valid configuration
    valid_config = {
        'region': 'us-east-1',
        'environment': 'production',
        'ec2_instances': {
            'instance_type': 't3.small',
            'count': 2
        },
        'rds_database': {
            'engine': 'postgresql',
            'instance_class': 'db.t3.micro'
        }
    }
    
    try:
        results = manager.deploy_infrastructure(valid_config)
        print("Deployment results:", results)
    except DevOpsException as e:
        print(f"DevOps error: {e}")
        print(f"Error code: {e.error_code}")
        print(f"Details: {e.details}")
    
    # Example 2: Invalid configuration
    invalid_config = {
        'ec2_instances': {
            'instance_type': 't3.small'
        }
    }
    
    try:
        results = manager.deploy_infrastructure(invalid_config)
        print("Deployment results:", results)
    except ConfigurationException as e:
        print(f"Configuration error: {e}")
        print(f"Missing fields: {e.details.get('missing_fields', [])}")

if __name__ == "__main__":
    main()
```

This comprehensive guide covers advanced Python language features specifically tailored for DevOps engineers. Each section includes practical examples and real-world usage scenarios that demonstrate how these concepts apply to infrastructure management, deployment automation, monitoring, and troubleshooting.

The examples show how to build robust, maintainable DevOps tools using advanced Python features like OOP design patterns, functional programming concepts, concurrency for performance, and comprehensive error handling strategies.