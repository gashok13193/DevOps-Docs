#!/usr/bin/env python3
"""
Day 5: Conditional Statements
=============================

Learn how to make decisions in your Python programs.
"""

print("=== IF STATEMENTS ===")

# Basic if statement
age = 18
if age >= 18:
    print("You are eligible to vote!")

# if-else statement
weather = "sunny"
if weather == "sunny":
    print("It's a beautiful day! Go outside.")
else:
    print("Maybe stay indoors today.")

# if-elif-else statement
score = 85

if score >= 90:
    grade = "A"
elif score >= 80:
    grade = "B"
elif score >= 70:
    grade = "C"
elif score >= 60:
    grade = "D"
else:
    grade = "F"

print(f"Score: {score}, Grade: {grade}")

print("\n=== COMPARISON OPERATORS ===")
x, y = 10, 15

# Multiple conditions
if x > 0 and y > 0:
    print("Both numbers are positive")

if x > 20 or y > 10:
    print("At least one number meets the criteria")

if not (x > y):
    print("x is not greater than y")

print("\n=== PRACTICAL EXAMPLES ===")

# Example 1: Password validator
password = "MySecurePass123"
has_upper = any(c.isupper() for c in password)
has_lower = any(c.islower() for c in password)
has_digit = any(c.isdigit() for c in password)
is_long_enough = len(password) >= 8

if has_upper and has_lower and has_digit and is_long_enough:
    print("✅ Password is strong!")
else:
    print("❌ Password is weak. It needs:")
    if not has_upper:
        print("  - At least one uppercase letter")
    if not has_lower:
        print("  - At least one lowercase letter")
    if not has_digit:
        print("  - At least one digit")
    if not is_long_enough:
        print("  - At least 8 characters")

# Example 2: BMI Calculator
height = 1.75  # meters
weight = 70    # kg
bmi = weight / (height ** 2)

print(f"\nBMI: {bmi:.1f}")
if bmi < 18.5:
    category = "Underweight"
elif bmi < 25:
    category = "Normal weight"
elif bmi < 30:
    category = "Overweight"
else:
    category = "Obese"

print(f"Category: {category}")

# Example 3: Age group classifier
age = 25

if age < 0:
    print("Invalid age")
elif age <= 2:
    print("Baby")
elif age <= 12:
    print("Child")
elif age <= 19:
    print("Teenager")
elif age <= 59:
    print("Adult")
else:
    print("Senior")

print("\n=== TERNARY OPERATOR ===")
# Shorthand for simple if-else
number = 42
result = "Even" if number % 2 == 0 else "Odd"
print(f"{number} is {result}")

# Multiple ternary operators
temperature = 25
clothing = "shorts" if temperature > 20 else "jacket" if temperature > 10 else "coat"
print(f"Temperature: {temperature}°C, Wear: {clothing}")

print("\n=== MEMBERSHIP TESTING ===")
vowels = "aeiou"
letter = "a"

if letter in vowels:
    print(f"'{letter}' is a vowel")
else:
    print(f"'{letter}' is a consonant")

# Check if value is in list
fruits = ["apple", "banana", "orange"]
fruit = "apple"

if fruit in fruits:
    print(f"{fruit} is available")

print("\n🏋️ INTERACTIVE EXERCISE:")
print("Let's build a simple quiz!")

# Uncomment the following lines to make it interactive:
# user_answer = input("What is the capital of France? ").strip().lower()
# if user_answer == "paris":
#     print("✅ Correct!")
# else:
#     print("❌ Incorrect. The answer is Paris.")

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Create a program that determines if a year is a leap year")
print("2. Build a simple calculator that handles division by zero")
print("3. Make a program that categorizes movies by rating (G, PG, PG-13, R)")
print("4. Create a login system that checks username and password")
