# Python for DevOps - YouTube Video Series

## Series Overview
A comprehensive 25-video series teaching Python specifically for DevOps engineers, SREs, and Infrastructure professionals. Focus on automation, monitoring, deployment, and infrastructure management.

**Prerequisites:** Basic Python knowledge (variables, functions, loops, conditionals)
**Target Audience:** DevOps Engineers, SREs, System Administrators, Cloud Engineers

---

## Video 1: Python for DevOps - Introduction & Environment Setup
**Duration:** 20-25 minutes
**Objective:** Understand why Python is crucial for DevOps and set up development environment

### Content Structure:
1. **Why Python for DevOps?** (5 min)
   - Automation capabilities
   - Rich ecosystem (libraries, tools)
   - Cloud provider SDKs
   - Infrastructure as Code support
   - Integration with CI/CD pipelines

2. **DevOps Python Environment Setup** (10 min)
   ```bash
   # Virtual environment setup
   python3 -m venv devops-env
   source devops-env/bin/activate  # Linux/Mac
   # devops-env\Scripts\activate  # Windows
   
   # Essential packages
   pip install requests boto3 paramiko psutil docker-py
   pip install pyyaml python-dotenv click typer
   pip install pytest pytest-cov black flake8
   ```

3. **Project Structure for DevOps Scripts** (5 min)
   ```
   devops-toolkit/
   ├── scripts/
   │   ├── monitoring/
   │   ├── deployment/
   │   └── infrastructure/
   ├── config/
   ├── tests/
   ├── requirements.txt
   ├── .env.example
   └── README.md
   ```

4. **First DevOps Script - System Health Check** (8 min)
   ```python
   #!/usr/bin/env python3
   import psutil
   import datetime
   
   def system_health_check():
       print("=== System Health Check ===")
       print(f"Timestamp: {datetime.datetime.now()}")
       
       # CPU Usage
       cpu_percent = psutil.cpu_percent(interval=1)
       print(f"CPU Usage: {cpu_percent}%")
       
       # Memory Usage
       memory = psutil.virtual_memory()
       print(f"Memory Usage: {memory.percent}%")
       print(f"Available Memory: {memory.available / (1024**3):.2f} GB")
       
       # Disk Usage
       disk = psutil.disk_usage('/')
       print(f"Disk Usage: {(disk.used / disk.total) * 100:.2f}%")
       print(f"Free Space: {disk.free / (1024**3):.2f} GB")
       
       # Network Stats
       network = psutil.net_io_counters()
       print(f"Bytes Sent: {network.bytes_sent / (1024**2):.2f} MB")
       print(f"Bytes Received: {network.bytes_recv / (1024**2):.2f} MB")
       
       # Running Processes
       processes = len(psutil.pids())
       print(f"Running Processes: {processes}")
   
   if __name__ == "__main__":
       system_health_check()
   ```

---

## Video 2: Configuration Management with Python
**Duration:** 25-30 minutes
**Objective:** Manage configuration files and environment variables effectively

### Content Structure:
1. **Working with Environment Variables** (8 min)
   ```python
   import os
   from dotenv import load_dotenv
   
   # Load environment variables
   load_dotenv()
   
   # Configuration class
   class Config:
       def __init__(self):
           self.database_url = os.getenv('DATABASE_URL', 'sqlite:///app.db')
           self.api_key = os.getenv('API_KEY')
           self.debug = os.getenv('DEBUG', 'False').lower() == 'true'
           self.log_level = os.getenv('LOG_LEVEL', 'INFO')
       
       def validate(self):
           if not self.api_key:
               raise ValueError("API_KEY environment variable is required")
   
   # Usage
   config = Config()
   config.validate()
   ```

2. **YAML Configuration Files** (8 min)
   ```python
   import yaml
   from pathlib import Path
   
   def load_config(config_file):
       """Load configuration from YAML file"""
       config_path = Path(config_file)
       if not config_path.exists():
           raise FileNotFoundError(f"Config file not found: {config_file}")
       
       with open(config_path, 'r') as file:
           return yaml.safe_load(file)
   
   def save_config(config_data, config_file):
       """Save configuration to YAML file"""
       with open(config_file, 'w') as file:
           yaml.dump(config_data, file, default_flow_style=False)
   
   # Example configuration
   app_config = {
       'server': {
           'host': '0.0.0.0',
           'port': 8080,
           'workers': 4
       },
       'database': {
           'host': 'localhost',
           'port': 5432,
           'name': 'myapp'
       },
       'monitoring': {
           'enabled': True,
           'interval': 30,
           'alerts': ['email', 'slack']
       }
   }
   ```

3. **Configuration Templates and Rendering** (7 min)
   ```python
   from jinja2 import Template
   import yaml
   
   def render_config_template(template_file, variables, output_file):
       """Render configuration template with variables"""
       with open(template_file, 'r') as file:
           template = Template(file.read())
       
       rendered = template.render(**variables)
       
       with open(output_file, 'w') as file:
           file.write(rendered)
       
       return rendered
   
   # Example: Nginx configuration template
   nginx_template = """
   server {
       listen {{ port }};
       server_name {{ server_name }};
       
       location / {
           proxy_pass {{ upstream_url }};
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       {% if ssl_enabled %}
       ssl_certificate {{ ssl_cert_path }};
       ssl_certificate_key {{ ssl_key_path }};
       {% endif %}
   }
   """
   
   variables = {
       'port': 80,
       'server_name': 'myapp.com',
       'upstream_url': 'http://localhost:8080',
       'ssl_enabled': True,
       'ssl_cert_path': '/etc/ssl/certs/myapp.crt',
       'ssl_key_path': '/etc/ssl/private/myapp.key'
   }
   ```

4. **Project: Configuration Management Tool**
   ```python
   import argparse
   import yaml
   import os
   from pathlib import Path
   
   class ConfigManager:
       def __init__(self, config_dir="./config"):
           self.config_dir = Path(config_dir)
           self.config_dir.mkdir(exist_ok=True)
       
       def create_environment(self, env_name, config_data):
           """Create configuration for a specific environment"""
           env_file = self.config_dir / f"{env_name}.yaml"
           with open(env_file, 'w') as file:
               yaml.dump(config_data, file, default_flow_style=False)
           print(f"Created configuration for {env_name}")
       
       def load_environment(self, env_name):
           """Load configuration for a specific environment"""
           env_file = self.config_dir / f"{env_name}.yaml"
           if not env_file.exists():
               raise FileNotFoundError(f"Environment {env_name} not found")
           
           with open(env_file, 'r') as file:
               return yaml.safe_load(file)
       
       def list_environments(self):
           """List all available environments"""
           envs = [f.stem for f in self.config_dir.glob("*.yaml")]
           return envs
       
       def validate_config(self, config_data):
           """Validate configuration structure"""
           required_keys = ['app', 'database', 'monitoring']
           for key in required_keys:
               if key not in config_data:
                   raise ValueError(f"Missing required section: {key}")
           return True
   
   def main():
       parser = argparse.ArgumentParser(description='Configuration Manager')
       parser.add_argument('action', choices=['create', 'load', 'list'])
       parser.add_argument('--env', help='Environment name')
       parser.add_argument('--config', help='Config file path')
       
       args = parser.parse_args()
       config_mgr = ConfigManager()
       
       if args.action == 'list':
           envs = config_mgr.list_environments()
           print("Available environments:", envs)
       
       elif args.action == 'load':
           if not args.env:
               print("Environment name required")
               return
           
           config = config_mgr.load_environment(args.env)
           print(yaml.dump(config, default_flow_style=False))
   
   if __name__ == "__main__":
       main()
   ```

---

## Video 3: File System Operations and Log Processing
**Duration:** 25-30 minutes
**Objective:** Master file operations crucial for DevOps tasks

### Content Structure:
1. **Advanced File Operations** (8 min)
   ```python
   import os
   import shutil
   import glob
   from pathlib import Path
   import stat
   
   def backup_files(source_dir, backup_dir, pattern="*"):
       """Backup files matching pattern"""
       source_path = Path(source_dir)
       backup_path = Path(backup_dir)
       backup_path.mkdir(parents=True, exist_ok=True)
       
       for file_path in source_path.glob(pattern):
           if file_path.is_file():
               dest_path = backup_path / file_path.name
               shutil.copy2(file_path, dest_path)
               print(f"Backed up: {file_path} -> {dest_path}")
   
   def cleanup_old_files(directory, days_old=7):
       """Remove files older than specified days"""
       import time
       current_time = time.time()
       
       for file_path in Path(directory).rglob("*"):
           if file_path.is_file():
               file_age = current_time - file_path.stat().st_mtime
               if file_age > (days_old * 24 * 3600):
                   file_path.unlink()
                   print(f"Deleted old file: {file_path}")
   
   def check_disk_space(path, threshold_gb=1):
       """Check if disk space is below threshold"""
       statvfs = os.statvfs(path)
       free_bytes = statvfs.f_frsize * statvfs.f_bavail
       free_gb = free_bytes / (1024**3)
       
       if free_gb < threshold_gb:
           print(f"WARNING: Low disk space: {free_gb:.2f} GB remaining")
           return False
       return True
   ```

2. **Log File Processing** (10 min)
   ```python
   import re
   import datetime
   from collections import Counter, defaultdict
   
   class LogAnalyzer:
       def __init__(self, log_file):
           self.log_file = log_file
           self.error_patterns = [
               r'ERROR',
               r'CRITICAL',
               r'FATAL',
               r'Exception',
               r'500\s+\d+',  # HTTP 500 errors
               r'404\s+\d+'   # HTTP 404 errors
           ]
       
       def parse_apache_log(self, line):
           """Parse Apache/Nginx access log line"""
           pattern = r'(\S+) \S+ \S+ \[([\w:/]+\s[+\-]\d{4})\] "(\S+) (\S+) (\S+)" (\d{3}) (\d+|-)'
           match = re.match(pattern, line)
           if match:
               return {
                   'ip': match.group(1),
                   'timestamp': match.group(2),
                   'method': match.group(3),
                   'url': match.group(4),
                   'protocol': match.group(5),
                   'status': int(match.group(6)),
                   'size': match.group(7)
               }
           return None
       
       def find_errors(self):
           """Find error patterns in logs"""
           errors = []
           with open(self.log_file, 'r') as file:
               for line_num, line in enumerate(file, 1):
                   for pattern in self.error_patterns:
                       if re.search(pattern, line, re.IGNORECASE):
                           errors.append({
                               'line': line_num,
                               'content': line.strip(),
                               'pattern': pattern
                           })
                           break
           return errors
       
       def analyze_access_logs(self):
           """Analyze web server access logs"""
           ip_counter = Counter()
           status_counter = Counter()
           url_counter = Counter()
           
           with open(self.log_file, 'r') as file:
               for line in file:
                   parsed = self.parse_apache_log(line)
                   if parsed:
                       ip_counter[parsed['ip']] += 1
                       status_counter[parsed['status']] += 1
                       url_counter[parsed['url']] += 1
           
           return {
               'top_ips': ip_counter.most_common(10),
               'status_codes': dict(status_counter),
               'top_urls': url_counter.most_common(10)
           }
       
       def generate_report(self):
           """Generate comprehensive log analysis report"""
           report = {
               'timestamp': datetime.datetime.now().isoformat(),
               'log_file': self.log_file,
               'errors': self.find_errors(),
               'access_analysis': self.analyze_access_logs()
           }
           return report
   ```

3. **Real-time Log Monitoring** (7 min)
   ```python
   import time
   import os
   
   def tail_log(log_file, callback=None):
       """Monitor log file for new entries (like tail -f)"""
       with open(log_file, 'r') as file:
           # Go to the end of file
           file.seek(0, os.SEEK_END)
           
           while True:
               line = file.readline()
               if line:
                   if callback:
                       callback(line.strip())
                   else:
                       print(line.strip())
               else:
                   time.sleep(0.1)
   
   def alert_on_error(line):
       """Callback function to alert on error patterns"""
       error_keywords = ['ERROR', 'CRITICAL', 'FATAL', 'Exception']
       
       for keyword in error_keywords:
           if keyword.lower() in line.lower():
               print(f"🚨 ALERT: {keyword} detected!")
               print(f"Line: {line}")
               # Here you could send notifications (email, Slack, etc.)
               break
   
   # Usage
   # tail_log('/var/log/application.log', alert_on_error)
   ```

---

## Video 4: Process Management and System Monitoring
**Duration:** 25-30 minutes
**Objective:** Monitor and manage system processes programmatically

### Content Structure:
1. **Process Information and Control** (10 min)
   ```python
   import psutil
   import subprocess
   import signal
   import time
   
   class ProcessManager:
       def __init__(self):
           pass
       
       def find_processes_by_name(self, name):
           """Find processes by name"""
           processes = []
           for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
               try:
                   if name.lower() in proc.info['name'].lower():
                       processes.append(proc)
               except (psutil.NoSuchProcess, psutil.AccessDenied):
                   pass
           return processes
       
       def get_process_info(self, pid):
           """Get detailed process information"""
           try:
               proc = psutil.Process(pid)
               return {
                   'pid': proc.pid,
                   'name': proc.name(),
                   'status': proc.status(),
                   'cpu_percent': proc.cpu_percent(),
                   'memory_percent': proc.memory_percent(),
                   'memory_info': proc.memory_info()._asdict(),
                   'create_time': proc.create_time(),
                   'cmdline': ' '.join(proc.cmdline()),
                   'num_threads': proc.num_threads(),
                   'connections': len(proc.connections())
               }
           except (psutil.NoSuchProcess, psutil.AccessDenied) as e:
               return {'error': str(e)}
       
       def kill_process_tree(self, pid, timeout=3):
           """Kill process and all its children"""
           try:
               parent = psutil.Process(pid)
               children = parent.children(recursive=True)
               
               # Terminate children first
               for child in children:
                   try:
                       child.terminate()
                   except psutil.NoSuchProcess:
                       pass
               
               # Wait for children to terminate
               gone, alive = psutil.wait_procs(children, timeout=timeout)
               
               # Kill remaining children
               for proc in alive:
                   try:
                       proc.kill()
                   except psutil.NoSuchProcess:
                       pass
               
               # Terminate parent
               parent.terminate()
               parent.wait(timeout)
               
           except psutil.TimeoutExpired:
               parent.kill()
           except psutil.NoSuchProcess:
               print(f"Process {pid} not found")
       
       def restart_service(self, service_name):
           """Restart system service"""
           try:
               # Stop service
               subprocess.run(['systemctl', 'stop', service_name], 
                            check=True, capture_output=True)
               
               # Wait a moment
               time.sleep(2)
               
               # Start service
               subprocess.run(['systemctl', 'start', service_name], 
                            check=True, capture_output=True)
               
               # Check status
               result = subprocess.run(['systemctl', 'is-active', service_name], 
                                     capture_output=True, text=True)
               
               return result.stdout.strip() == 'active'
               
           except subprocess.CalledProcessError as e:
               print(f"Error restarting service {service_name}: {e}")
               return False
   ```

2. **System Monitoring Dashboard** (10 min)
   ```python
   import psutil
   import time
   import json
   from datetime import datetime
   
   class SystemMonitor:
       def __init__(self):
           self.monitoring = False
           self.data = []
       
       def collect_metrics(self):
           """Collect system metrics"""
           metrics = {
               'timestamp': datetime.now().isoformat(),
               'cpu': {
                   'percent': psutil.cpu_percent(interval=1),
                   'count': psutil.cpu_count(),
                   'freq': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None
               },
               'memory': psutil.virtual_memory()._asdict(),
               'disk': {},
               'network': psutil.net_io_counters()._asdict(),
               'processes': {
                   'total': len(psutil.pids()),
                   'running': len([p for p in psutil.process_iter() 
                                 if p.status() == psutil.STATUS_RUNNING])
               }
           }
           
           # Disk usage for all mounted filesystems
           for partition in psutil.disk_partitions():
               try:
                   usage = psutil.disk_usage(partition.mountpoint)
                   metrics['disk'][partition.mountpoint] = usage._asdict()
               except PermissionError:
                   continue
           
           return metrics
       
       def start_monitoring(self, interval=60, duration=None):
           """Start monitoring system metrics"""
           self.monitoring = True
           start_time = time.time()
           
           print(f"Starting system monitoring (interval: {interval}s)")
           
           while self.monitoring:
               metrics = self.collect_metrics()
               self.data.append(metrics)
               
               # Print summary
               cpu = metrics['cpu']['percent']
               memory = metrics['memory']['percent']
               print(f"[{metrics['timestamp']}] CPU: {cpu}% | Memory: {memory}%")
               
               # Check if duration exceeded
               if duration and (time.time() - start_time) > duration:
                   break
               
               time.sleep(interval)
       
       def stop_monitoring(self):
           """Stop monitoring"""
           self.monitoring = False
       
       def export_data(self, filename):
           """Export collected data to JSON"""
           with open(filename, 'w') as file:
               json.dump(self.data, file, indent=2)
           print(f"Data exported to {filename}")
       
       def generate_alert(self, metrics):
           """Generate alerts based on thresholds"""
           alerts = []
           
           # CPU alert
           if metrics['cpu']['percent'] > 80:
               alerts.append(f"High CPU usage: {metrics['cpu']['percent']}%")
           
           # Memory alert
           if metrics['memory']['percent'] > 85:
               alerts.append(f"High memory usage: {metrics['memory']['percent']}%")
           
           # Disk space alerts
           for mount, disk_info in metrics['disk'].items():
               usage_percent = (disk_info['used'] / disk_info['total']) * 100
               if usage_percent > 90:
                   alerts.append(f"Low disk space on {mount}: {usage_percent:.1f}%")
           
           return alerts
   ```

---

## Videos 5-25: Additional Topics

### Video 5: Network Operations and HTTP Requests (25 min)
- Making HTTP requests with requests library
- API authentication and error handling
- Network connectivity testing
- Project: Health check monitor for microservices

### Video 6: Working with Databases (30 min)
- Database connections (PostgreSQL, MySQL, MongoDB)
- Connection pooling and management
- Database backup automation
- Project: Database health monitor

### Video 7: AWS SDK (Boto3) Fundamentals (30 min)
- AWS authentication and configuration
- EC2 instance management
- S3 operations (upload, download, sync)
- Project: EC2 inventory and cost optimizer

### Video 8: Docker Automation with Python (30 min)
- Docker SDK for Python
- Container lifecycle management
- Image building and registry operations
- Project: Container health monitor

### Video 9: Kubernetes Client and Automation (35 min)
- Kubernetes Python client
- Pod, Service, Deployment management
- Cluster monitoring and scaling
- Project: K8s resource optimizer

### Video 10: CI/CD Pipeline Integration (25 min)
- Jenkins API integration
- GitLab CI/CD with Python
- GitHub Actions automation
- Project: Deployment status dashboard

### Video 11: Infrastructure as Code with Python (30 min)
- Terraform with Python
- Pulumi basics
- CDK (Cloud Development Kit)
- Project: Infrastructure provisioning tool

### Video 12: Monitoring and Alerting Systems (30 min)
- Prometheus metrics collection
- Grafana API integration
- Custom alerting systems
- Project: Multi-service monitoring dashboard

### Video 13: Log Aggregation and Analysis (25 min)
- ELK stack integration
- Fluentd/Fluent Bit automation
- Log shipping and parsing
- Project: Centralized logging system

### Video 14: Security and Compliance Automation (30 min)
- Security scanning automation
- Certificate management
- Vulnerability assessments
- Project: Security compliance checker

### Video 15: Backup and Disaster Recovery (25 min)
- Automated backup strategies
- Database backup automation
- Recovery testing scripts
- Project: Comprehensive backup system

### Video 16: Performance Testing and Load Generation (30 min)
- Load testing with locust
- Performance metrics collection
- Bottleneck identification
- Project: Automated performance testing

### Video 17: ChatOps and Slack Integration (25 min)
- Slack bot development
- Command execution via chat
- Notification systems
- Project: DevOps Slack bot

### Video 18: Configuration Drift Detection (25 min)
- System state monitoring
- Configuration comparison
- Drift reporting and alerting
- Project: Infrastructure drift detector

### Video 19: Cost Optimization and Resource Management (30 min)
- Cloud cost analysis
- Resource utilization tracking
- Auto-scaling automation
- Project: Cloud cost optimizer

### Video 20: Multi-Cloud Operations (30 min)
- AWS, Azure, GCP integration
- Cross-cloud resource management
- Unified monitoring
- Project: Multi-cloud inventory system

### Video 21: Incident Response Automation (25 min)
- Automated incident detection
- Response workflow automation
- Post-incident analysis
- Project: Incident response system

### Video 22: Data Pipeline and ETL Operations (30 min)
- Data extraction and transformation
- Pipeline orchestration
- Data quality monitoring
- Project: Log data pipeline

### Video 23: Service Mesh Management (30 min)
- Istio automation
- Service discovery
- Traffic management
- Project: Service mesh monitoring

### Video 24: GitOps and Git Automation (25 min)
- Git repository automation
- Branch and merge automation
- Deployment via Git workflows
- Project: GitOps deployment system

### Video 25: DevOps Toolkit - Complete Project (45 min)
- Combining all learned concepts
- Building a comprehensive DevOps automation suite
- Best practices and patterns
- Project: Enterprise DevOps platform

---

## Series Completion Benefits:
After completing this series, viewers will be able to:
- Automate infrastructure management tasks
- Build monitoring and alerting systems
- Integrate with major cloud providers
- Create CI/CD automation tools
- Implement security and compliance automation
- Develop incident response systems
- Build cost optimization tools
- Create comprehensive DevOps platforms

## Required Tools and Technologies:
- Python 3.8+
- Docker and Kubernetes
- AWS/Azure/GCP accounts (free tier)
- Linux/Unix environment
- Git and version control
- Popular DevOps tools (Jenkins, Terraform, etc.)

## Prerequisites for Each Video:
Each video will clearly state required knowledge and provide setup instructions for tools and services used.

## Hands-on Projects:
- Every video includes practical, real-world projects
- Projects build upon each other
- Final capstone project integrates all concepts
- All code available in accompanying GitHub repository

## Community and Support:
- Discord server for Q&A and collaboration
- GitHub repository with all code examples
- Regular live Q&A sessions
- Industry expert guest appearances