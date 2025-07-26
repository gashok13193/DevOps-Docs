# Python Introduction, Basics & Installation Guide

## Table of Contents
1. [What is Python?](#what-is-python)
2. [Why Learn Python?](#why-learn-python)
3. [Installation](#installation)
4. [Basic Syntax](#basic-syntax)
5. [Data Types](#data-types)
6. [Control Structures](#control-structures)
7. [Functions](#functions)
8. [Getting Started](#getting-started)

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
```

### Indentation
Python uses indentation to define code blocks (instead of curly braces):
```python
if age >= 18:
    print("You are an adult")
    print("You can vote")
else:
    print("You are a minor")
```

## Data Types

### Basic Data Types
```python
# Numbers
integer_num = 42
float_num = 3.14
complex_num = 2 + 3j

# Strings
text = "Hello"
multiline = """This is a
multiline string"""

# Boolean
is_true = True
is_false = False

# None (equivalent to null in other languages)
nothing = None
```

### Collections
```python
# Lists (mutable, ordered)
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]

# Tuples (immutable, ordered)
coordinates = (10, 20)
rgb = (255, 128, 0)

# Dictionaries (key-value pairs)
person = {
    "name": "John",
    "age": 30,
    "city": "New York"
}

# Sets (unique elements)
unique_numbers = {1, 2, 3, 4, 5}
```

## Control Structures

### Conditional Statements
```python
age = 18

if age >= 18:
    print("Adult")
elif age >= 13:
    print("Teenager")
else:
    print("Child")
```

### Loops

#### For Loop
```python
# Iterate over a list
fruits = ["apple", "banana", "orange"]
for fruit in fruits:
    print(fruit)

# Iterate over a range
for i in range(5):  # 0 to 4
    print(i)

# Iterate over a range with start and step
for i in range(2, 10, 2):  # 2, 4, 6, 8
    print(i)
```

#### While Loop
```python
count = 0
while count < 5:
    print(count)
    count += 1
```

### List Comprehensions
```python
# Create a list of squares
squares = [x**2 for x in range(10)]

# Filter even numbers
evens = [x for x in range(20) if x % 2 == 0]
```

## Functions

### Basic Function
```python
def greet(name):
    return f"Hello, {name}!"

# Call the function
message = greet("Alice")
print(message)
```

### Function with Default Parameters
```python
def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

print(greet("Bob"))  # Uses default greeting
print(greet("Bob", "Hi"))  # Uses custom greeting
```

### Function with Multiple Return Values
```python
def get_name_age():
    return "Alice", 25

name, age = get_name_age()
```

## Getting Started

### 1. Set Up Your Development Environment

#### Text Editors/IDEs:
- **Beginner**: IDLE (comes with Python), VS Code, Sublime Text
- **Advanced**: PyCharm, Vim, Emacs

#### Install useful packages:
```bash
# Install popular packages
pip3 install requests numpy pandas matplotlib jupyter
```

### 2. Create Your First Program

Create a file called `hello.py`:
```python
def main():
    name = input("What's your name? ")
    age = int(input("What's your age? "))
    
    print(f"Hello, {name}!")
    print(f"You are {age} years old.")
    
    if age >= 18:
        print("You can vote!")
    else:
        years_to_vote = 18 - age
        print(f"You can vote in {years_to_vote} years.")

if __name__ == "__main__":
    main()
```

Run it:
```bash
python3 hello.py
```

### 3. Python Package Management

#### Virtual Environments (Recommended):
```bash
# Create a virtual environment
python3 -m venv myproject

# Activate it
# On Linux/macOS:
source myproject/bin/activate
# On Windows:
myproject\Scripts\activate

# Install packages in the virtual environment
pip install requests

# Deactivate when done
deactivate
```

#### Requirements File:
```bash
# Save current packages to requirements.txt
pip freeze > requirements.txt

# Install packages from requirements.txt
pip install -r requirements.txt
```

### 4. Next Steps

1. **Practice Basic Concepts**: Variables, loops, functions
2. **Learn Standard Library**: `os`, `sys`, `datetime`, `json`
3. **Explore Popular Libraries**:
   - Web: `requests`, `flask`, `django`
   - Data Science: `numpy`, `pandas`, `matplotlib`
   - Machine Learning: `scikit-learn`, `tensorflow`, `pytorch`
4. **Build Projects**: Start with simple scripts, then web apps or data analysis
5. **Join the Community**: Python.org, Reddit r/Python, Stack Overflow

### Useful Resources

- **Official Documentation**: [docs.python.org](https://docs.python.org)
- **Tutorial**: [Python.org Tutorial](https://docs.python.org/3/tutorial/)
- **Practice**: [LeetCode](https://leetcode.com), [HackerRank](https://hackerrank.com)
- **Books**: "Automate the Boring Stuff with Python", "Python Crash Course"

---

**Happy Coding! 🐍**