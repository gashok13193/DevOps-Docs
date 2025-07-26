# Python Introduction, Basics & Installation Guide

## What is Python?

Python is a high-level, interpreted programming language known for its simplicity and readability. Created by Guido van Rossum and first released in 1991, Python emphasizes code readability and allows developers to express concepts in fewer lines of code compared to other languages.

### Key Features:
- **Easy to Learn**: Simple, clean syntax
- **Interpreted**: No need to compile before running
- **Cross-platform**: Runs on Windows, macOS, Linux
- **Large Standard Library**: "Batteries included" philosophy
- **Active Community**: Extensive third-party packages

## Why Learn Python?

- **Beginner-friendly**: Great first programming language
- **Versatile**: Web development, data science, AI/ML, automation
- **High demand**: Popular in industry and academia
- **Rapid prototyping**: Quick development and testing
- **Open source**: Free to use and modify

## Installation

### Windows

#### Method 1: Official Python Installer
1. Visit [python.org](https://www.python.org/downloads/)
2. Download the latest Python 3.x version
3. Run the installer
4. **Important**: Check "Add Python to PATH" during installation
5. Click "Install Now"

#### Method 2: Microsoft Store
1. Open Microsoft Store
2. Search for "Python 3.x"
3. Click "Get" to install

### macOS

#### Method 1: Official Python Installer
1. Visit [python.org](https://www.python.org/downloads/)
2. Download the latest Python 3.x version for macOS
3. Run the .pkg installer
4. Follow the installation wizard

#### Method 2: Homebrew (Recommended)
```bash
# Install Homebrew first (if not already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Python
brew install python
```

### Linux (Ubuntu/Debian)

#### Update package list and install Python
```bash
# Update package list
sudo apt update

# Install Python 3 and pip
sudo apt install python3 python3-pip

# Install additional development tools (optional but recommended)
sudo apt install python3-dev python3-venv
```

### Linux (CentOS/RHEL/Fedora)

#### For CentOS/RHEL:
```bash
# Install Python 3
sudo yum install python3 python3-pip

# Or for newer versions:
sudo dnf install python3 python3-pip
```

#### For Fedora:
```bash
sudo dnf install python3 python3-pip
```

### Verify Installation

Open terminal/command prompt and run:
```bash
python3 --version
# or on Windows sometimes:
python --version

# Check pip installation
pip3 --version
# or on Windows sometimes:
pip --version
```

## Basic Syntax

### Hello World
```python
print("Hello, World!")
```

### Variables
```python
# No need to declare variable types
name = "Alice"
age = 25
height = 5.6
is_student = True
```

### Comments
```python
# This is a single-line comment

"""
This is a
multi-line comment
"""
