#!/usr/bin/env python3
"""
Day 3: Lists and Tuples
=======================

Learn about Python's most fundamental data structures.
"""

print("=== LISTS ===")
# Lists are mutable (can be changed) ordered collections

# Creating lists
fruits = ["apple", "banana", "orange"]
numbers = [1, 2, 3, 4, 5]
mixed_list = ["hello", 42, 3.14, True]
empty_list = []

print(f"Fruits: {fruits}")
print(f"Numbers: {numbers}")
print(f"Mixed list: {mixed_list}")
print(f"Empty list: {empty_list}")

print("\n--- List Operations ---")
# Accessing elements (0-indexed)
print(f"First fruit: {fruits[0]}")
print(f"Last fruit: {fruits[-1]}")
print(f"Second fruit: {fruits[1]}")

# Slicing
print(f"First two fruits: {fruits[0:2]}")
print(f"All except first: {fruits[1:]}")
print(f"Last two: {fruits[-2:]}")

# Adding elements
fruits.append("grape")  # Add to end
print(f"After append: {fruits}")

fruits.insert(1, "kiwi")  # Insert at index
print(f"After insert: {fruits}")

# Removing elements
fruits.remove("banana")  # Remove by value
print(f"After remove: {fruits}")

popped = fruits.pop()  # Remove and return last
print(f"Popped: {popped}, List now: {fruits}")

# List methods
print(f"\nLength: {len(fruits)}")
print(f"Count of 'apple': {fruits.count('apple')}")
print(f"Index of 'orange': {fruits.index('orange')}")

# List comprehension (advanced but very useful)
squares = [x**2 for x in range(1, 6)]
print(f"Squares: {squares}")

print("\n=== TUPLES ===")
# Tuples are immutable (cannot be changed) ordered collections

# Creating tuples
coordinates = (10, 20)
rgb_color = (255, 128, 0)
single_item = (42,)  # Note the comma for single item
empty_tuple = ()

print(f"Coordinates: {coordinates}")
print(f"RGB Color: {rgb_color}")
print(f"Single item: {single_item}")

# Accessing tuple elements
print(f"X coordinate: {coordinates[0]}")
print(f"Y coordinate: {coordinates[1]}")

# Tuple unpacking
x, y = coordinates
print(f"Unpacked: x={x}, y={y}")

r, g, b = rgb_color
print(f"RGB: Red={r}, Green={g}, Blue={b}")

# When to use lists vs tuples
print("\n--- When to use which? ---")
print("Lists: When you need to modify the collection")
print("Tuples: For fixed data (coordinates, RGB values, etc.)")

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Create a list of your favorite movies")
print("2. Add a new movie to the list")
print("3. Remove a movie you don't like anymore")
print("4. Create a tuple with your birth date (year, month, day)")
print("5. Unpack the tuple into separate variables")
