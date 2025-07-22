#!/usr/bin/env python3
"""
Python Mastery - Quick Start Script
===================================

Run this script to begin your Python learning journey!
"""

import os
import sys

def print_banner():
    """Print a welcome banner."""
    print("=" * 60)
    print("🐍 WELCOME TO PYTHON MASTERY! 🐍")
    print("=" * 60)
    print("Your comprehensive Python learning journey starts here!")
    print()

def check_python_version():
    """Check Python version."""
    version = sys.version_info
    print(f"✅ Python Version: {version.major}.{version.minor}.{version.micro}")
    if version.major >= 3 and version.minor >= 6:
        print("✅ Python version is compatible!")
    else:
        print("⚠️  Consider upgrading to Python 3.6 or higher")
    print()

def show_learning_path():
    """Display the learning path."""
    print("📚 YOUR LEARNING PATH:")
    lessons = [
        ("01-Basics", "Variables, data types, operators"),
        ("02-Data-Structures", "Lists, tuples, dictionaries, sets"),
        ("03-Control-Flow", "If statements, loops, break/continue"),
        ("04-Functions", "Function definition, parameters, scope"),
        ("05-OOP", "Classes, objects, inheritance"),
        ("06-File-IO", "Reading/writing files"),
        ("07-Error-Handling", "Try/except, debugging"),
        ("08-Modules", "Imports, packages"),
        ("09-Advanced", "Decorators, generators"),
        ("10-Projects", "Real-world applications")
    ]
    
    for i, (folder, description) in enumerate(lessons, 1):
        print(f"  {i:2d}. {folder:15} - {description}")
    print()

def show_next_steps():
    """Show immediate next steps."""
    print("🚀 GET STARTED NOW:")
    print("1. Run your first Python program:")
    print("   python3 01-Basics/hello_world.py")
    print()
    print("2. Practice with exercises:")
    print("   python3 exercises/beginner_exercises.py")
    print()
    print("3. Follow the sequential order for best results!")
    print()

def check_directory_structure():
    """Check if all directories exist."""
    directories = [
        "01-Basics", "02-Data-Structures", "03-Control-Flow",
        "04-Functions", "05-OOP", "06-File-IO", "07-Error-Handling",
        "08-Modules", "09-Advanced", "10-Projects", "exercises", "solutions"
    ]
    
    missing_dirs = []
    for directory in directories:
        if not os.path.exists(directory):
            missing_dirs.append(directory)
    
    if missing_dirs:
        print(f"⚠️  Missing directories: {', '.join(missing_dirs)}")
        print("Please ensure all learning directories are created.")
    else:
        print("✅ All learning directories found!")
    print()

def show_tips():
    """Show learning tips."""
    print("💡 LEARNING TIPS:")
    tips = [
        "Code every day, even if just 15-30 minutes",
        "Type the code yourself - don't just read it",
        "Experiment with examples and modify them",
        "Practice exercises before moving to next topic",
        "Build small projects to apply what you learn",
        "Join Python communities for help and motivation"
    ]
    
    for tip in tips:
        print(f"  • {tip}")
    print()

def main():
    """Main function to run the quick start."""
    print_banner()
    check_python_version()
    check_directory_structure()
    show_learning_path()
    show_next_steps()
    show_tips()
    
    print("=" * 60)
    print("🎯 Ready to become a Python master? Let's start coding!")
    print("=" * 60)

if __name__ == "__main__":
    main()
