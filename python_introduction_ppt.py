#!/usr/bin/env python3
"""
Python Introduction PowerPoint Presentation

This script creates a beautiful and comprehensive PowerPoint presentation
about Python programming, covering what Python is, installation steps,
and practical examples.
"""

import os
from datetime import datetime
from ppt_generator import PPTGenerator

def create_python_introduction_ppt():
    """Create a beautiful Python introduction presentation."""
    
    print("🐍 Creating Beautiful Python Introduction Presentation...")
    
    # Create a new presentation with Python-themed colors
    ppt = PPTGenerator()
    
    # Set Python-themed colors (Python blue and yellow)
    ppt.set_theme_colors((55, 118, 171), (255, 212, 59))  # Python blue and yellow
    
    # 1. Title slide
    ppt.add_title_slide(
        "Introduction to Python Programming",
        "Your Journey into the World's Most Popular Programming Language\n\nFrom Beginner to Developer",
        "Python Programming Course"
    )
    
    # 2. Table of Contents
    ppt.add_content_slide(
        "What We'll Cover Today",
        [
            "What is Python? - Understanding the Language",
            "Why Choose Python? - Benefits and Advantages", 
            "Real-World Applications - Where Python Shines",
            "Installation Guide - Step-by-Step Setup",
            "Your First Python Program - Hello World!",
            "Development Environment - VS Code Setup",
            "Next Steps - Your Python Journey"
        ]
    )
    
    # 3. What is Python? Section
    ppt.add_section_slide("What is Python?", (55, 118, 171))
    
    # 4. Python definition
    ppt.add_content_slide(
        "What is Python?",
        [
            "One of the most popular programming languages today",
            "Beginner-friendly with simple and readable syntax",
            "Requires fewer lines of code compared to C++ or Java",
            "High-level, interpreted programming language",
            "Created by Guido van Rossum in 1991",
            "Named after 'Monty Python's Flying Circus'",
            "Open-source and completely free to use"
        ]
    )
    
    # 5. Python vs Other Languages comparison
    ppt.add_two_column_slide(
        "Python vs Other Languages",
        [
            "Python Code:",
            "print('Hello, World!')",
            "",
            "# Simple and readable",
            "# Just 1 line of code",
            "# No complex syntax",
            "# Beginner-friendly"
        ],
        [
            "Java Code:",
            "public class HelloWorld {",
            "  public static void main(",
            "    String[] args) {",
            "    System.out.println(",
            "      'Hello, World!');",
            "  }",
            "}"
        ]
    )
    
    # 6. Why Choose Python?
    ppt.add_content_slide(
        "Why Choose Python?",
        [
            "🚀 Easy to Learn - Simple, English-like syntax",
            "📚 Extensive Libraries - Thousands of pre-built modules",
            "🌍 Cross-Platform - Works on Windows, Mac, and Linux",
            "👥 Large Community - Millions of developers worldwide",
            "💼 High Demand - Top-paying programming jobs",
            "🔧 Versatile - Used in many different fields",
            "🆓 Open Source - Free to use and modify"
        ]
    )
    
    # 7. Real-World Applications Section
    ppt.add_section_slide("Real-World Applications", (255, 212, 59))
    
    # 8. Python Applications
    ppt.add_content_slide(
        "Where Python is Used",
        [
            "🌐 Web Development - Django, Flask frameworks",
            "🤖 Data Science & AI - Pandas, NumPy, TensorFlow",
            "⚙️ Automation & DevOps - Scripting, CI/CD pipelines",
            "🎮 Game Development - Pygame, Panda3D",
            "📱 Desktop Applications - Tkinter, PyQt",
            "🔬 Scientific Computing - SciPy, Matplotlib",
            "🔐 Cybersecurity - Penetration testing, security tools"
        ]
    )
    
    # 9. Companies using Python
    ppt.add_two_column_slide(
        "Companies Using Python",
        [
            "Tech Giants:",
            "• Google - Search, YouTube",
            "• Netflix - Recommendation engine",
            "• Instagram - Backend systems",
            "• Spotify - Data analysis",
            "• Uber - Dynamic pricing"
        ],
        [
            "Other Industries:",
            "• NASA - Space missions",
            "• Bank of America - Trading",
            "• Pixar - Animation tools",
            "• Dropbox - File sync",
            "• Reddit - Platform backend"
        ]
    )
    
    # 10. Popularity chart
    popularity_data = {
        "categories": ["2019", "2020", "2021", "2022", "2023", "2024"],
        "series": [
            {
                "name": "Python Popularity Index",
                "values": [85, 88, 92, 95, 98, 100]
            }
        ]
    }
    ppt.add_chart_slide("Python's Growing Popularity", popularity_data, "line")
    
    # 11. Installation Section
    ppt.add_section_slide("Installation Guide", (171, 55, 118))
    
    # 12. Installation overview
    ppt.add_content_slide(
        "Installation Steps Overview",
        [
            "Step 1: Download Python from python.org",
            "Step 2: Run the installer (important settings!)",
            "Step 3: Verify installation works",
            "Step 4: Install VS Code editor",
            "Step 5: Install Python extension",
            "Step 6: Create your first program",
            "Step 7: Run and celebrate! 🎉"
        ]
    )
    
    # 13. Download Python
    ppt.add_content_slide(
        "Step 1: Download Python",
        [
            "🌐 Go to python.org/downloads",
            "📥 Click 'Download Python' (latest version)",
            "💡 Tip: Always download the latest stable version",
            "✅ Recommended: Python 3.11+ or 3.12+",
            "⚠️ Avoid Python 2.x (deprecated)",
            "📱 Available for Windows, Mac, and Linux",
            "🔒 Official downloads are safe and verified"
        ]
    )
    
    # 14. Installation process
    ppt.add_two_column_slide(
        "Step 2: Install Python",
        [
            "Windows Installation:",
            "• Run the downloaded .exe file",
            "• ✅ Check 'Add Python to PATH'",
            "• ✅ Check 'Install for all users'",
            "• Click 'Install Now'",
            "• Wait for completion"
        ],
        [
            "Mac/Linux Installation:",
            "• Mac: Run the .pkg file",
            "• Linux: Use package manager",
            "• Ubuntu: sudo apt install python3",
            "• Follow installation prompts",
            "• Python may be pre-installed"
        ]
    )
    
    # 15. Verification
    ppt.add_content_slide(
        "Step 3: Verify Installation",
        [
            "Open Command Prompt (Windows) or Terminal (Mac/Linux)",
            "Type: python --version",
            "Or try: python3 --version",
            "You should see: Python 3.x.x",
            "If it works: ✅ Installation successful!",
            "If not working: Check PATH settings",
            "Alternative: Type 'python' to enter interactive mode"
        ]
    )
    
    # 16. VS Code setup
    ppt.add_content_slide(
        "Step 4: Install VS Code",
        [
            "🌐 Download from code.visualstudio.com",
            "🎯 VS Code is free and highly recommended",
            "📦 Install the Python Extension (by Microsoft)",
            "🔧 Extensions → Search 'Python' → Install",
            "✨ Features: Syntax highlighting, debugging, IntelliSense",
            "🎨 Customize with themes and extensions",
            "💡 Alternative editors: PyCharm, Sublime Text, Atom"
        ]
    )
    
    # 17. First Program Section
    ppt.add_section_slide("Your First Python Program", (118, 171, 55))
    
    # 18. Hello World
    ppt.add_content_slide(
        "Step 5: Create Your First Program",
        [
            "In VS Code, create a new file",
            "Save it as 'hello.py'",
            "Type: print('Hello, World!')",
            "Save the file (Ctrl+S or Cmd+S)",
            "Right-click → 'Run Python File in Terminal'",
            "Or use terminal: python hello.py",
            "Congratulations! You're now a Python programmer! 🎉"
        ]
    )
    
    # 19. Python basics
    ppt.add_two_column_slide(
        "Basic Python Concepts",
        [
            "Variables & Data Types:",
            "name = 'John'  # String",
            "age = 25       # Integer", 
            "height = 5.9   # Float",
            "is_student = True # Boolean",
            "",
            "Print & Input:",
            "print('Hello!')",
            "name = input('Your name: ')"
        ],
        [
            "Lists & Operations:",
            "fruits = ['apple', 'banana']",
            "fruits.append('orange')",
            "print(fruits[0])  # apple",
            "",
            "Simple Functions:",
            "def greet(name):",
            "    return f'Hello, {name}!'",
            "print(greet('World'))"
        ]
    )
    
    # 20. Practice examples
    ppt.add_content_slide(
        "Fun Practice Projects",
        [
            "🎲 Number Guessing Game - Random numbers and loops",
            "🧮 Simple Calculator - Basic math operations",
            "📝 To-Do List - Lists and user input",
            "🌡️ Temperature Converter - Functions and formulas",
            "📊 Grade Calculator - Conditionals and averages",
            "🎵 Rock Paper Scissors - Logic and randomness",
            "📚 Personal Library - File handling and data"
        ]
    )
    
    # 21. Learning Resources Section
    ppt.add_section_slide("Next Steps & Resources", (212, 171, 55))
    
    # 22. Learning path
    ppt.add_content_slide(
        "Your Python Learning Journey",
        [
            "📖 Week 1-2: Basic syntax, variables, data types",
            "🔄 Week 3-4: Loops, conditionals, functions",
            "📚 Week 5-6: Lists, dictionaries, file handling",
            "🎯 Week 7-8: Object-oriented programming",
            "🌐 Week 9-10: Web development or data science",
            "🚀 Week 11-12: Build real projects",
            "💼 Month 4+: Specialize in your area of interest"
        ]
    )
    
    # 23. Resources
    ppt.add_two_column_slide(
        "Learning Resources",
        [
            "Free Online Resources:",
            "• Python.org tutorial",
            "• freeCodeCamp Python course",
            "• Codecademy Python track",
            "• YouTube Python tutorials",
            "• W3Schools Python section",
            "• Real Python website"
        ],
        [
            "Books & Paid Courses:",
            "• 'Automate the Boring Stuff'",
            "• 'Python Crash Course'",
            "• Udemy Python courses",
            "• Coursera Python specialization",
            "• edX MIT Python course",
            "• PyCharm educational edition"
        ]
    )
    
    # 24. Career opportunities
    career_data = {
        "categories": ["Python Developer", "Data Scientist", "DevOps Engineer", "AI/ML Engineer", "Web Developer"],
        "series": [
            {
                "name": "Average Salary (USD)",
                "values": [95000, 120000, 110000, 130000, 85000]
            }
        ]
    }
    ppt.add_chart_slide("Python Career Opportunities", career_data, "column")
    
    # 25. Tips for success
    ppt.add_content_slide(
        "Tips for Python Success",
        [
            "💪 Practice Daily - Even 30 minutes makes a difference",
            "🏗️ Build Projects - Apply what you learn immediately",
            "🤝 Join Communities - Stack Overflow, Reddit r/Python",
            "📖 Read Others' Code - Learn from open-source projects",
            "🐛 Debug Fearlessly - Errors are learning opportunities",
            "📚 Stay Curious - Explore new libraries and frameworks",
            "🎯 Focus on Fundamentals - Master the basics first"
        ]
    )
    
    # 26. Common beginner mistakes
    ppt.add_two_column_slide(
        "Common Mistakes to Avoid",
        [
            "❌ Common Mistakes:",
            "• Skipping error messages",
            "• Not using version control",
            "• Trying to memorize everything",
            "• Jumping to advanced topics",
            "• Not practicing regularly",
            "• Giving up too quickly"
        ],
        [
            "✅ Best Practices:",
            "• Read error messages carefully",
            "• Use Git from day one",
            "• Focus on understanding",
            "• Master basics first",
            "• Code every day",
            "• Be patient with yourself"
        ]
    )
    
    # 27. Final motivation
    ppt.add_content_slide(
        "Why You'll Love Python",
        [
            "🎯 Quick Results - See your programs work immediately",
            "🌟 Endless Possibilities - From games to AI to websites",
            "👥 Amazing Community - Helpful and welcoming developers",
            "📈 Career Growth - High-demand, well-paying opportunities",
            "🧠 Problem Solving - Develops logical thinking skills",
            "🔄 Continuous Learning - Always something new to discover",
            "🎉 Fun Factor - Programming can be genuinely enjoyable!"
        ]
    )
    
    # 28. Conclusion
    ppt.add_section_slide("Conclusion", (55, 118, 171))
    
    # 29. Summary
    ppt.add_content_slide(
        "Key Takeaways",
        [
            "🐍 Python is beginner-friendly and powerful",
            "🌍 Used by top companies worldwide",
            "📥 Easy to install and get started",
            "💻 VS Code is an excellent development environment",
            "🚀 Start with simple programs and build up",
            "📚 Abundant learning resources available",
            "💼 Excellent career opportunities await",
            "🎯 Your Python journey starts today!"
        ]
    )
    
    # 30. Thank you slide
    ppt.add_title_slide(
        "Thank You!",
        "Welcome to the Python Community!\n\n🐍 Happy Coding! 🐍\n\nQuestions & Discussion",
        "Python Programming Course Team"
    )
    
    # Save the presentation
    filename = f"python_introduction_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pptx"
    saved_path = ppt.save(filename)
    
    # Print summary
    print(f"✅ Beautiful Python presentation created!")
    print(f"📁 Saved as: {saved_path}")
    print(f"📄 Total slides: {ppt.get_slide_count()}")
    print(f"📊 File size: {os.path.getsize(saved_path) / 1024:.1f} KB")
    print(f"🎨 Theme: Python blue and yellow colors")
    print(f"🐍 Content: Complete Python introduction guide")
    
    return saved_path

if __name__ == "__main__":
    create_python_introduction_ppt()