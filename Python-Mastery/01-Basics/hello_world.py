#!/usr/bin/env python3
"""
Day 1: Your First Python Program
================================

Welcome to Python! This is your very first Python script.
Let's start with the traditional "Hello, World!" program.
"""

# This is a comment - Python ignores everything after the # symbol
print("Hello, World!")

# Let's make it more interactive
name = input("What's your name? ")
print(f"Hello, {name}! Welcome to Python programming!")

# Basic variables and data types
age = 25                    # Integer
height = 5.9               # Float  
is_student = True          # Boolean
favorite_language = "Python"  # String

print(f"\nVariable Examples:")
print(f"Age: {age} (type: {type(age)})")
print(f"Height: {height} (type: {type(height)})")
print(f"Is student: {is_student} (type: {type(is_student)})")
print(f"Favorite language: {favorite_language} (type: {type(favorite_language)})")

# Simple calculations
birth_year = 2024 - age
print(f"\nYou were born around: {birth_year}")

print("\n🎉 Congratulations! You've run your first Python program!")
print("Next: Try modifying the variables and run the script again.")
