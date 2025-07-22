#!/usr/bin/env python3
"""
Day 2: Variables and Operators
==============================

Learn about different variable types and operators in Python.
"""

print("=== VARIABLES AND DATA TYPES ===")

# Numbers
integer_num = 42
float_num = 3.14159
complex_num = 2 + 3j

print(f"Integer: {integer_num}")
print(f"Float: {float_num}")
print(f"Complex: {complex_num}")

# Strings
single_quotes = 'Hello'
double_quotes = "World"
multi_line = """This is a
multi-line
string"""

print(f"\nString examples:")
print(f"Single quotes: {single_quotes}")
print(f"Double quotes: {double_quotes}")
print(f"Multi-line:\n{multi_line}")

# Boolean
is_python_fun = True
is_difficult = False
print(f"\nBoolean: {is_python_fun}, {is_difficult}")

print("\n=== ARITHMETIC OPERATORS ===")
a, b = 10, 3

print(f"a = {a}, b = {b}")
print(f"Addition: {a} + {b} = {a + b}")
print(f"Subtraction: {a} - {b} = {a - b}")
print(f"Multiplication: {a} * {b} = {a * b}")
print(f"Division: {a} / {b} = {a / b}")
print(f"Floor Division: {a} // {b} = {a // b}")
print(f"Modulo: {a} % {b} = {a % b}")
print(f"Exponentiation: {a} ** {b} = {a ** b}")

print("\n=== COMPARISON OPERATORS ===")
x, y = 5, 5
print(f"x = {x}, y = {y}")
print(f"Equal: x == y → {x == y}")
print(f"Not equal: x != y → {x != y}")
print(f"Greater than: x > y → {x > y}")
print(f"Less than: x < y → {x < y}")
print(f"Greater or equal: x >= y → {x >= y}")
print(f"Less or equal: x <= y → {x <= y}")

print("\n=== LOGICAL OPERATORS ===")
p, q = True, False
print(f"p = {p}, q = {q}")
print(f"AND: p and q → {p and q}")
print(f"OR: p or q → {p or q}")
print(f"NOT: not p → {not p}")

print("\n=== STRING OPERATIONS ===")
first_name = "John"
last_name = "Doe"
full_name = first_name + " " + last_name
print(f"Concatenation: {full_name}")
print(f"Repetition: {'Ha' * 3}")
print(f"Length: len('{full_name}') = {len(full_name)}")
print(f"Uppercase: {full_name.upper()}")
print(f"Lowercase: {full_name.lower()}")

# Exercise for you
print("\n🏋️ EXERCISE:")
print("Try changing the values of variables and observe the results!")
print("Create your own variables and test different operators.")
