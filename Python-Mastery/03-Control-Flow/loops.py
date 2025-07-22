#!/usr/bin/env python3
"""
Day 6: Loops in Python
======================

Learn how to repeat operations efficiently using loops.
"""

print("=== FOR LOOPS ===")

# Basic for loop with range
print("Counting from 1 to 5:")
for i in range(1, 6):
    print(f"Count: {i}")

print("\nCounting backwards:")
for i in range(5, 0, -1):
    print(f"Countdown: {i}")

# Looping through lists
fruits = ["apple", "banana", "orange", "grape"]
print("\nFruits in my basket:")
for fruit in fruits:
    print(f"- {fruit}")

# Looping with index
print("\nFruits with index:")
for index, fruit in enumerate(fruits):
    print(f"{index + 1}. {fruit}")

# Looping through strings
word = "Python"
print(f"\nLetters in '{word}':")
for letter in word:
    print(f"'{letter}'")

# Looping through dictionaries
person = {"name": "Alice", "age": 30, "city": "New York"}
print("\nPerson details:")
for key, value in person.items():
    print(f"{key}: {value}")

print("\n=== WHILE LOOPS ===")

# Basic while loop
count = 1
print("While loop counting:")
while count <= 5:
    print(f"Count: {count}")
    count += 1

# While loop with user input simulation
password_attempts = 0
correct_password = "secret123"
user_password = "wrong"  # Simulated user input

print("\nPassword checking:")
while user_password != correct_password and password_attempts < 3:
    password_attempts += 1
    print(f"Attempt {password_attempts}: Password incorrect")
    # In real scenario: user_password = input("Enter password: ")
    if password_attempts == 1:
        user_password = "stillwrong"
    elif password_attempts == 2:
        user_password = "secret123"  # Correct on third attempt

if user_password == correct_password:
    print("✅ Access granted!")
else:
    print("❌ Too many failed attempts")

print("\n=== LOOP CONTROL ===")

# Break statement
print("Finding first even number:")
numbers = [1, 3, 7, 8, 9, 10, 11]
for num in numbers:
    if num % 2 == 0:
        print(f"First even number found: {num}")
        break
    print(f"Checking: {num} (odd)")

# Continue statement
print("\nPrinting only positive numbers:")
numbers = [-2, -1, 0, 1, 2, 3]
for num in numbers:
    if num <= 0:
        continue  # Skip to next iteration
    print(f"Positive: {num}")

# Else clause with loops
print("\nSearching for a specific item:")
search_list = ["cat", "dog", "bird"]
search_item = "fish"

for item in search_list:
    if item == search_item:
        print(f"Found {search_item}!")
        break
    print(f"Checking: {item}")
else:
    # This runs if loop completes without break
    print(f"{search_item} not found in the list")

print("\n=== NESTED LOOPS ===")

# Multiplication table
print("Multiplication table (3x3):")
for i in range(1, 4):
    for j in range(1, 4):
        result = i * j
        print(f"{i} x {j} = {result}")
    print()  # Empty line after each row

# Pattern printing
print("Star pattern:")
for row in range(1, 6):
    for star in range(row):
        print("*", end="")
    print()  # New line after each row

print("\n=== PRACTICAL EXAMPLES ===")

# Example 1: Sum of numbers
numbers = [10, 20, 30, 40, 50]
total = 0
for num in numbers:
    total += num
print(f"Sum of {numbers} = {total}")

# Example 2: Finding maximum
numbers = [45, 67, 23, 89, 12, 98, 34]
maximum = numbers[0]
for num in numbers[1:]:
    if num > maximum:
        maximum = num
print(f"Maximum in {numbers} = {maximum}")

# Example 3: Factorial calculation
n = 5
factorial = 1
for i in range(1, n + 1):
    factorial *= i
print(f"Factorial of {n} = {factorial}")

# Example 4: Palindrome checker
word = "radar"
is_palindrome = True
length = len(word)
for i in range(length // 2):
    if word[i] != word[length - 1 - i]:
        is_palindrome = False
        break

print(f"'{word}' is {'a palindrome' if is_palindrome else 'not a palindrome'}")

print("\n=== LIST COMPREHENSIONS ===")
# Elegant way to create lists with loops

# Basic list comprehension
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")

# With condition
even_squares = [x**2 for x in range(1, 11) if x % 2 == 0]
print(f"Even squares: {even_squares}")

# String operations
words = ["python", "java", "javascript", "go"]
uppercase_words = [word.upper() for word in words]
long_words = [word for word in words if len(word) > 4]

print(f"Uppercase: {uppercase_words}")
print(f"Long words: {long_words}")

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Print the first 10 Fibonacci numbers")
print("2. Count vowels in a given string")
print("3. Create a program that prints all prime numbers up to 50")
print("4. Build a simple guessing game using while loop")
print("5. Print a diamond pattern using nested loops")

# Bonus: FizzBuzz
print("\n🎯 BONUS - FizzBuzz Challenge:")
for i in range(1, 21):
    if i % 15 == 0:
        print("FizzBuzz")
    elif i % 3 == 0:
        print("Fizz")
    elif i % 5 == 0:
        print("Buzz")
    else:
        print(i)
