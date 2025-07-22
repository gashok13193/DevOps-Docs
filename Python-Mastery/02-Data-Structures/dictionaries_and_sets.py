#!/usr/bin/env python3
"""
Day 4: Dictionaries and Sets
============================

Learn about Python's key-value storage and unique collections.
"""

print("=== DICTIONARIES ===")
# Dictionaries store key-value pairs

# Creating dictionaries
person = {
    "name": "Alice",
    "age": 30,
    "city": "New York",
    "is_employed": True
}

# Different ways to create dictionaries
empty_dict = {}
dict_from_pairs = dict([("a", 1), ("b", 2)])
dict_comprehension = {x: x**2 for x in range(1, 4)}

print(f"Person: {person}")
print(f"Dict from pairs: {dict_from_pairs}")
print(f"Dict comprehension: {dict_comprehension}")

print("\n--- Dictionary Operations ---")
# Accessing values
print(f"Name: {person['name']}")
print(f"Age: {person.get('age')}")
print(f"Country: {person.get('country', 'Unknown')}")  # Default value

# Adding/updating values
person["email"] = "alice@email.com"
person["age"] = 31  # Update existing key
print(f"Updated person: {person}")

# Removing items
del person["is_employed"]
removed_city = person.pop("city")
print(f"Removed city: {removed_city}")
print(f"Person now: {person}")

# Dictionary methods
print(f"\nKeys: {list(person.keys())}")
print(f"Values: {list(person.values())}")
print(f"Items: {list(person.items())}")

# Iterating through dictionary
print("\n--- Iterating ---")
for key, value in person.items():
    print(f"{key}: {value}")

print("\n=== SETS ===")
# Sets store unique elements (no duplicates)

# Creating sets
fruits = {"apple", "banana", "orange"}
numbers = {1, 2, 3, 3, 4, 4, 5}  # Duplicates automatically removed
empty_set = set()  # Note: {} creates empty dict, not set

print(f"Fruits set: {fruits}")
print(f"Numbers set: {numbers}")  # Notice duplicates are gone

# Set from list (removes duplicates)
list_with_duplicates = [1, 2, 2, 3, 3, 3, 4]
unique_numbers = set(list_with_duplicates)
print(f"Unique from list: {unique_numbers}")

print("\n--- Set Operations ---")
# Adding elements
fruits.add("grape")
fruits.update(["kiwi", "mango"])
print(f"After adding: {fruits}")

# Removing elements
fruits.remove("banana")  # Raises error if not found
fruits.discard("pineapple")  # Doesn't raise error if not found
print(f"After removing: {fruits}")

# Set mathematical operations
set1 = {1, 2, 3, 4}
set2 = {3, 4, 5, 6}

print(f"\nSet1: {set1}")
print(f"Set2: {set2}")
print(f"Union (|): {set1 | set2}")
print(f"Intersection (&): {set1 & set2}")
print(f"Difference (-): {set1 - set2}")
print(f"Symmetric difference (^): {set1 ^ set2}")

# Membership testing
print(f"\nIs 3 in set1? {3 in set1}")
print(f"Is 7 in set1? {7 in set1}")

print("\n=== PRACTICAL EXAMPLES ===")

# Dictionary: Student grades
grades = {
    "Alice": [85, 90, 78],
    "Bob": [92, 88, 84],
    "Charlie": [79, 95, 87]
}

print("Student Averages:")
for student, scores in grades.items():
    average = sum(scores) / len(scores)
    print(f"{student}: {average:.1f}")

# Set: Finding unique visitors
website_visitors = ["user1", "user2", "user1", "user3", "user2", "user4"]
unique_visitors = set(website_visitors)
print(f"\nTotal visits: {len(website_visitors)}")
print(f"Unique visitors: {len(unique_visitors)}")
print(f"Unique visitors list: {unique_visitors}")

print("\n🏋️ PRACTICE EXERCISES:")
print("1. Create a dictionary for a book (title, author, year, pages)")
print("2. Create a set of programming languages you want to learn")
print("3. Use set operations to find common languages between two programmers")
print("4. Build a simple phone book using a dictionary")
