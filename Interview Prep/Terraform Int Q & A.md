### 🧩 **1️⃣ What is the difference between `terraform import` and `terraform state` commands?**

- `terraform import` — brings existing cloud resources under Terraform management **without recreating** them.
    
    Example:
    
    ```bash
    terraform import aws_instance.myserver i-0abcd1234
    
    ```
    
- `terraform state` — lets you **inspect, move, or remove** items from the Terraform state file.
    
    Example:
    
    ```bash
    terraform state list
    terraform state rm aws_instance.myserver
    
    ```
    

**Key Point:**

`import` adds to state; `state` modifies or inspects it.

---

### ⚙️ **2️⃣ How does Terraform handle dependencies between resources?**

Terraform automatically builds a **dependency graph** using:

- **Implicit dependencies** → created when one resource references another.
- **Explicit dependencies** → defined using the `depends_on` argument.

**Example:**

```hcl
resource "aws_instance" "app" {
  depends_on = [aws_s3_bucket.logs]
}

```

This ensures the S3 bucket is created before the EC2 instance.

---

### 🧠 **3️⃣ What are Terraform Workspaces and when should you use them?**

Workspaces let you manage **multiple environments** (e.g., dev, staging, prod) using the same configuration but separate **state files**.

**Commands:**

```bash
terraform workspace new dev
terraform workspace select prod

```

**Use Case:**

To isolate environments while reusing the same code.

---

### 🧩 **4️⃣ Explain `locals` and their use in Terraform.**

`locals` define **named expressions** that simplify code reuse.

**Example:**

```hcl
locals {
  env_name = "dev"
  common_tags = {
    Environment = local.env_name
    Owner       = "Ashok"
  }
}

resource "aws_s3_bucket" "bucket" {
  bucket = "myapp-${local.env_name}"
  tags   = local.common_tags
}

```

They make your code DRY (Don’t Repeat Yourself).

---

### 🧰 **5️⃣ What are Terraform Provisioners, and why are they discouraged?**

Provisioners run scripts **on local or remote machines** after resource creation.

**Example:**

```hcl
provisioner "remote-exec" {
  inline = ["sudo apt update", "sudo apt install nginx -y"]
}

```

**But:**

- Provisioners make Terraform less **idempotent**.
- Use **user_data**, **cloud-init**, or **configuration management tools** instead.

---

### ⚡ **6️⃣ How does Terraform manage remote state and what are the benefits?**

Remote state stores the Terraform state file in a **shared backend** like S3, GCS, or Terraform Cloud.

**Benefits:**

- Collaboration for teams
- State locking to prevent race conditions
- Backups & versioning

**Example (S3 backend):**

```hcl
terraform {
  backend "s3" {
    bucket = "tf-state-bucket"
    key    = "prod/terraform.tfstate"
    region = "ap-south-1"
  }
}

```

---

### 🧩 **7️⃣ What is the Terraform Lock File (`.terraform.lock.hcl`)?**

This file locks the **provider versions** used in your project.

**Purpose:**

- Ensures consistency across machines and CI/CD.
- Avoids breaking changes when providers update.

**Command:**

```bash
terraform init -upgrade

```

→ updates provider versions and regenerates the lock file.

---

### 🧠 **8️⃣ How can you modularize Terraform configurations effectively?**

Use **modules** — reusable building blocks of Terraform.

**Structure:**

```
/modules
  /vpc
    main.tf
    outputs.tf
    variables.tf

```

**Usage:**

```hcl
module "vpc" {
  source = "./modules/vpc"
  cidr_block = "10.0.0.0/16"
}

```

**Best Practice:**

Keep modules small, reusable, and version-controlled.

---

### 🧩 **9️⃣ How does Terraform handle drift detection and correction?**

Terraform detects drift by comparing:

- The **current state file**
- The **actual infrastructure**

**Command:**

```bash
terraform plan

```

It highlights resources that have changed outside Terraform.

**To fix drift:**

- Run `terraform apply` to reconcile changes.

---

### 🔐 **🔟 How do you secure sensitive data in Terraform?**

Use:

1. `sensitive = true` in variables
    
    ```hcl
    variable "db_password" {
      type      = string
      sensitive = true
    }
    
    ```
    
2. **Do not** hardcode secrets in `.tf` files.
3. Use **secret managers** like AWS Secrets Manager, Vault, or SSM Parameter Store.
4. Store state securely