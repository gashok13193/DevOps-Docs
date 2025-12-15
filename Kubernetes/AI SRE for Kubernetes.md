# AI SRE for Kubernetes

An intelligent automated troubleshooting system for Kubernetes using AI/LLM to diagnose and fix common pod issues.

---

## 1️⃣ Prerequisites

### Environment

**Kubernetes:**
- ✅ Docker Desktop (K8s enabled) or
- ✅ Minikube

**Tools:**
- `kubectl`
- `python3`
- `pip`

**API Key:**
- OpenAI API key OR
- Ollama (local & free)

---

## 2️⃣ Installation & Setup

### Step 1: Install & Verify Ollama

**Install:**

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Start service:**

```bash
ollama serve
```

**Pull a model:**

```bash
ollama pull gemma:2b
```

### Step 2: Install Python

```bash
sudo apt update
sudo apt install -y python3 python3-pip python3-venv
```

### Step 3: Create a Virtual Environment

```bash
mkdir ai-sre-demo
cd ai-sre-demo

python3 -m venv venv
source venv/bin/activate
```

**Install dependency:**

```bash
pip install requests ollama
```

---

## 3️⃣ AI SRE Python Script

Create a file named `ai_sre.py`:

```python
import subprocess
import ollama
import sys

NAMESPACE = "default"
DEPLOYMENT = "broken-app"
CONTAINER = "app"

def safe_run(cmd):
    try:
        return subprocess.check_output(cmd, shell=True, text=True)
    except subprocess.CalledProcessError as e:
        return e.output

def get_status():
    return safe_run(f"kubectl get pods -l app=broken-app -n {NAMESPACE}")

def get_logs():
    return safe_run(f"kubectl logs deployment/{DEPLOYMENT} -n {NAMESPACE}")

def get_events():
    return safe_run(f"kubectl describe pod -l app=broken-app -n {NAMESPACE}")

def ask_ai(logs, events):
    prompt = f"""
You are a Kubernetes SRE.

LOGS:
{logs}

EVENTS:
{events}

TASK:
Choose ONE fix type.

Allowed FIX_TYPE:
SET_IMAGE
SET_ENV
SET_MEMORY
NONE

Rules:
- Do not write kubectl commands
- Only classify the fix

FORMAT STRICTLY:

ISSUE:
ROOT_CAUSE:
FIX_TYPE:
FIX_VALUE:
"""

    response = ollama.chat(
        model="gemma:2b",
        messages=[{"role": "user", "content": prompt}]
    )
    return response["message"]["content"]

def parse_response(text):
    data = {}
    for line in text.splitlines():
        if ":" in line:
            k, v = line.split(":", 1)
            data[k.strip()] = v.strip()
    return data

def build_fix(fix_type, fix_value):
    if fix_type == "SET_IMAGE":
        return f"kubectl set image deployment/{DEPLOYMENT} {CONTAINER}={fix_value}"
    if fix_type == "SET_ENV":
        return f"kubectl set env deployment/{DEPLOYMENT} {fix_value}"
    if fix_type == "SET_MEMORY":
        return f"kubectl set resources deployment/{DEPLOYMENT} --limits=memory={fix_value}"
    return None

def fallback(logs, events):
    if "ImagePullBackOff" in events:
        return "kubectl set image deployment/broken-app app=nginx:latest"
    if "OOMKilled" in events:
        return "kubectl set resources deployment/broken-app --limits=memory=256Mi"
    if "DB_URL" in logs:
        return "kubectl set env deployment/broken-app DB_URL=postgres://db:5432/app"
    return None

print("\n🔍 POD STATUS")
print(get_status())

logs = get_logs()
events = get_events()

print("\n📄 LOGS\n", logs)
print("\n📄 EVENTS\n", events)

analysis = ask_ai(logs, events)
print("\n🤖 AI SRE ANALYSIS\n", analysis)

parsed = parse_response(analysis)
cmd = build_fix(parsed.get("FIX_TYPE"), parsed.get("FIX_VALUE"))

if not cmd:
    cmd = fallback(logs, events)

if not cmd:
    print("❌ No safe fix available")
    sys.exit(1)

print("\n✅ Proposed Fix:\n", cmd)

approve = input("\nApprove fix? (yes/no): ").lower()
if approve == "yes":
    print("\n🚀 Applying fix...\n")
    subprocess.run(cmd, shell=True)
else:
    print("❌ Fix skipped")
```

---

## 4️⃣ Test Scenarios

### Scenario 1: Image Pull Backoff

Create `broken-image.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: broken-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: broken-app
  template:
    metadata:
      labels:
        app: broken-app
    spec:
      containers:
      - name: app
        image: nginx:not-exist
```

**Apply and test:**

```bash
kubectl apply -f broken-image.yaml
python3 ai_sre.py
```

### Scenario 2: OOMKilled (Out of Memory)

Create `broken-memory.yaml`:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: broken-app
spec:
  replicas: 1
  selector:
    matchLabels:
      app: broken-app
  template:
    metadata:
      labels:
        app: broken-app
    spec:
      containers:
      - name: app
        image: polinux/stress
        command: ["stress"]
        args: ["--vm", "1", "--vm-bytes", "100M"]
        resources:
          limits:
            memory: "32Mi"
```

**Apply and test:**

```bash
kubectl apply -f broken-memory.yaml
python3 ai_sre.py
```

---

## 5️⃣ How It Works

1. **Status Check**: The script checks pod status using `kubectl get pods`
2. **Data Collection**: Gathers logs and events from the failing pod
3. **AI Analysis**: Sends the data to Ollama/Gemma model for analysis
4. **Fix Generation**: AI suggests a fix type and value
5. **Command Building**: Script constructs the appropriate `kubectl` command
6. **User Approval**: Asks for confirmation before applying the fix
7. **Fallback**: If AI fails, uses pattern-based fallback logic

---

## 6️⃣ Supported Fix Types

- **SET_IMAGE**: Fixes ImagePullBackOff errors by updating the container image
- **SET_ENV**: Adds or modifies environment variables
- **SET_MEMORY**: Adjusts memory limits for OOMKilled pods
- **NONE**: No fix available or issue requires manual intervention

---

## 7️⃣ Usage

1. Deploy a broken application to Kubernetes
2. Run the AI SRE script:
   ```bash
   python3 ai_sre.py
   ```
3. Review the AI analysis and proposed fix
4. Approve or reject the fix
5. Monitor the pod status after the fix is applied

---

## 8️⃣ Benefits

- 🤖 **Automated Diagnosis**: AI analyzes logs and events to identify issues
- ⚡ **Fast Resolution**: Quickly suggests fixes for common problems
- 🛡️ **Safety**: Requires user approval before applying changes
- 🔄 **Fallback Logic**: Pattern-based fixes if AI analysis fails
- 📊 **Comprehensive**: Analyzes both logs and events for better diagnosis

---

## 9️⃣ Limitations

- Only handles common Kubernetes issues (ImagePullBackOff, OOMKilled, missing env vars)
- Requires manual approval for safety
- AI model quality affects diagnosis accuracy
- May need customization for specific environments

---

## 🔟 Extending the System

To add more fix types, modify the `build_fix()` function:

```python
def build_fix(fix_type, fix_value):
    if fix_type == "SET_IMAGE":
        return f"kubectl set image deployment/{DEPLOYMENT} {CONTAINER}={fix_value}"
    if fix_type == "SET_ENV":
        return f"kubectl set env deployment/{DEPLOYMENT} {fix_value}"
    if fix_type == "SET_MEMORY":
        return f"kubectl set resources deployment/{DEPLOYMENT} --limits=memory={fix_value}"
    # Add more fix types here
    if fix_type == "SET_CPU":
        return f"kubectl set resources deployment/{DEPLOYMENT} --limits=cpu={fix_value}"
    return None
```
