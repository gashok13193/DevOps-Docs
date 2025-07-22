#!/usr/bin/env python3
"""
Day 7: Functions in Python
==========================

Learn how to create reusable code with functions.
"""

print("=== BASIC FUNCTIONS ===")

# Simple function definition
def greet():
    """A simple function that prints a greeting."""
    print("Hello, World!")

# Call the function
greet()

# Function with parameters
def greet_person(name):
    """Greet a specific person."""
    print(f"Hello, {name}!")

greet_person("Alice")
greet_person("Bob")

# Function with return value
def add_numbers(a, b):
    """Add two numbers and return the result."""
    result = a + b
    return result

sum_result = add_numbers(5, 3)
print(f"5 + 3 = {sum_result}")

# Function with multiple parameters
def calculate_rectangle_area(length, width):
    """Calculate the area of a rectangle."""
    area = length * width
    return area

area = calculate_rectangle_area(10, 5)
print(f"Rectangle area: {area}")

print("\n=== DEFAULT PARAMETERS ===")

def greet_with_title(name, title="Mr/Ms"):
    """Greet someone with an optional title."""
    return f"Hello, {title} {name}!"

print(greet_with_title("Smith"))
print(greet_with_title("Johnson", "Dr"))

def power(base, exponent=2):
    """Calculate base raised to exponent (default: square)."""
    return base ** exponent

print(f"2^3 = {power(2, 3)}")
print(f"5^2 = {power(5)}")  # Uses default exponent

print("\n=== KEYWORD ARGUMENTS ===")

def create_profile(name, age, city="Unknown", occupation="Student"):
    """Create a user profile."""
    return {
        "name": name,
        "age": age,
        "city": city,
        "occupation": occupation
    }

# Using positional arguments
profile1 = create_profile("Alice", 25)
print(f"Profile 1: {profile1}")

# Using keyword arguments
profile2 = create_profile(name="Bob", age=30, city="NYC", occupation="Engineer")
print(f"Profile 2: {profile2}")

# Mixed positional and keyword
profile3 = create_profile("Charlie", 28, occupation="Designer")
print(f"Profile 3: {profile3}")

print("\n=== VARIABLE-LENGTH ARGUMENTS ===")

# *args for variable positional arguments
def sum_all(*numbers):
    """Sum any number of arguments."""
    total = 0
    for num in numbers:
        total += num
    return total

print(f"Sum of 1,2,3: {sum_all(1, 2, 3)}")
print(f"Sum of 1,2,3,4,5: {sum_all(1, 2, 3, 4, 5)}")

# **kwargs for variable keyword arguments
def print_info(**kwargs):
    """Print any number of keyword arguments."""
    for key, value in kwargs.items():
        print(f"{key}: {value}")

print("\nUser information:")
print_info(name="David", age=35, city="London", hobby="Photography")

# Combining different parameter types
def flexible_function(required, default_param="default", *args, **kwargs):
    """Function with all parameter types."""
    print(f"Required: {required}")
    print(f"Default: {default_param}")
    print(f"Args: {args}")
    print(f"Kwargs: {kwargs}")

print("\nFlexible function example:")
flexible_function("must_have", "optional", 1, 2, 3, name="Eve", age=40)

print("\n=== SCOPE AND VARIABLES ===")

global_var = "I'm global"

def scope_demo():
    local_var = "I'm local"
    print(f"Inside function - Global: {global_var}")
    print(f"Inside function - Local: {local_var}")

scope_demo()
print(f"Outside function - Global: {global_var}")
# print(local_var)  # This would cause an error!

# Global keyword
counter = 0

def increment_counter():
    global counter
    counter += 1
    return counter

print(f"Counter: {increment_counter()}")
print(f"Counter: {increment_counter()}")
print(f"Counter: {increment_counter()}")

print("\n=== LAMBDA FUNCTIONS ===")

# Lambda (anonymous) functions
square = lambda x: x ** 2
print(f"Square of 5: {square(5)}")

add = lambda x, y: x + y
print(f"3 + 7 = {add(3, 7)}")

# Using lambda with built-in functions
numbers = [1, 2, 3, 4, 5]
squared_numbers = list(map(lambda x: x**2, numbers))
print(f"Squared numbers: {squared_numbers}")

even_numbers = list(filter(lambda x: x % 2 == 0, numbers))
print(f"Even numbers: {even_numbers}")

print("\n=== PRACTICAL EXAMPLES ===")

def validate_email(email):
    """Simple email validation."""
    if "@" in email and "." in email:
        parts = email.split("@")
        if len(parts) == 2 and len(parts[0]) > 0 and len(parts[1]) > 0:
            return True
    return False

emails = ["test@example.com", "invalid.email", "user@domain.org"]
for email in emails:
    status = "✅ Valid" if validate_email(email) else "❌ Invalid"
    print(f"{email}: {status}")

def fibonacci(n):
    """Generate the first n Fibonacci numbers."""
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    elif n == 2:
        return [0, 1]
    
    sequence = [0, 1]
    for i in range(2, n):
        next_num = sequence[i-1] + sequence[i-2]
        sequence.append(next_num)
    return sequence

print(f"\nFirst 10 Fibonacci numbers: {fibonacci(10)}")

def is_palindrome(text):
    """Check if text is a palindrome."""
    # Remove spaces and convert to lowercase
    clean_text = text.replace(" ", "").lower()
    return clean_text == clean_text[::-1]

test_words = ["radar", "hello", "A man a plan a canal Panama"]
for word in test_words:
    result = "is" if is_palindrome(word) else "is not"
    print(f"'{word}' {result} a palindrome")

def factorial(n):
    """Calculate factorial recursively."""
    if n <= 1:
        return 1
    return n * factorial(n - 1)

print(f"\nFactorial of 5: {factorial(5)}")

print("\n=== FUNCTION DOCUMENTATION ===")

def well_documented_function(param1, param2=None):
    """
    This is a well-documented function.
    
    Args:
        param1 (str): The first parameter
        param2 (int, optional): The second parameter. Defaults to None.
    
    Returns:
        str: A formatted string with both parameters
    
    Example:
        >>> well_documented_function("hello", 42)
        'hello - 42'
    """
    if param2 is None:
        return f"Only param1: {param1}"
    return f"{param1} - {param2}"

# Access function documentation
print("Function documentation:")
print(well_documented_function.__doc__)

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Create a function to calculate compound interest")
print("2. Write a function to find the largest number in a list")
print("3. Create a password generator function")
print("4. Build a function that converts temperature (Celsius/Fahrenheit)")
print("5. Write a function to count word frequency in a text")
