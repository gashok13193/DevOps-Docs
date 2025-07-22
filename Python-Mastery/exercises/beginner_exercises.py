#!/usr/bin/env python3
"""
Beginner Python Exercises
=========================

Complete these exercises to practice Python fundamentals.
"""

print("=== EXERCISE 1: BASIC CALCULATOR ===")
print("Create a calculator that performs basic operations")

def calculator():
    """
    TODO: Create a simple calculator function that:
    1. Takes two numbers as input
    2. Takes an operation (+, -, *, /) as input
    3. Performs the calculation
    4. Returns the result
    5. Handles division by zero
    """
    # Your code here
    pass

# Test your calculator
# result = calculator()
# print(f"Result: {result}")

print("\n=== EXERCISE 2: WORD COUNTER ===")
print("Count words in a sentence")

def count_words(sentence):
    """
    TODO: Create a function that:
    1. Takes a sentence as input
    2. Counts the number of words
    3. Counts the number of characters (excluding spaces)
    4. Returns a dictionary with the counts
    """
    # Your code here
    pass

# Test your function
test_sentence = "Python is an amazing programming language"
# result = count_words(test_sentence)
# print(f"Sentence: '{test_sentence}'")
# print(f"Results: {result}")

print("\n=== EXERCISE 3: SHOPPING LIST ===")
print("Create a shopping list manager")

class ShoppingList:
    """
    TODO: Create a ShoppingList class that:
    1. Initializes with an empty list
    2. Has methods to add items
    3. Has methods to remove items  
    4. Has a method to display all items
    5. Has a method to check if an item exists
    6. Has a method to count total items
    """
    
    def __init__(self):
        # Your code here
        pass
    
    def add_item(self, item):
        # Your code here
        pass
    
    def remove_item(self, item):
        # Your code here
        pass
    
    def display_list(self):
        # Your code here
        pass
    
    def item_exists(self, item):
        # Your code here
        pass
    
    def count_items(self):
        # Your code here
        pass

# Test your shopping list
# shopping = ShoppingList()
# shopping.add_item("Apples")
# shopping.add_item("Bread")
# shopping.display_list()

print("\n=== EXERCISE 4: GRADE CALCULATOR ===")
print("Calculate student grades and GPA")

def calculate_grade(scores):
    """
    TODO: Create a function that:
    1. Takes a list of test scores (0-100)
    2. Calculates the average
    3. Determines letter grade (A: 90+, B: 80-89, C: 70-79, D: 60-69, F: <60)
    4. Returns both average and letter grade
    """
    # Your code here
    pass

# Test your function
test_scores = [85, 92, 78, 96, 88]
# average, letter = calculate_grade(test_scores)
# print(f"Scores: {test_scores}")
# print(f"Average: {average:.1f}")
# print(f"Letter Grade: {letter}")

print("\n=== EXERCISE 5: PASSWORD VALIDATOR ===")
print("Create a strong password validator")

def validate_password(password):
    """
    TODO: Create a function that validates if a password is strong:
    1. At least 8 characters long
    2. Contains at least one uppercase letter
    3. Contains at least one lowercase letter
    4. Contains at least one digit
    5. Contains at least one special character (!@#$%^&*)
    6. Returns True if valid, False otherwise
    7. Also returns a list of requirements not met
    """
    # Your code here
    pass

# Test your function
test_passwords = ["weak", "StrongPass123!", "nodigits!", "NOCAPS123!"]
# for pwd in test_passwords:
#     is_valid, issues = validate_password(pwd)
#     print(f"Password: '{pwd}' - Valid: {is_valid}")
#     if issues:
#         print(f"  Issues: {', '.join(issues)}")

print("\n=== BONUS CHALLENGE: NUMBER GUESSING GAME ===")
print("Create an interactive number guessing game")

def number_guessing_game():
    """
    TODO: Create a number guessing game that:
    1. Generates a random number between 1-100
    2. Asks user to guess the number
    3. Provides hints (too high/too low)
    4. Counts the number of attempts
    5. Congratulates when correct
    6. Offers to play again
    """
    import random
    # Your code here
    pass

# Uncomment to play the game
# number_guessing_game()

print("\n📝 INSTRUCTIONS:")
print("1. Complete each function by replacing 'pass' with your code")
print("2. Uncomment the test lines to run your solutions")
print("3. Make sure your code handles edge cases")
print("4. Test with different inputs to ensure robustness")
print("5. Check the solutions folder when you're done!")
